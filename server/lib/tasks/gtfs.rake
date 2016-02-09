namespace :omgtransit do
  require 'omgtransit/transit_systems'

  # =========================================================================
  # Stop type constants (yes they are constants you don't need to check):
  # =========================================================================

  ST_IGNORE     = -1
  ST_BUS        = 1
  ST_BIKE       = 2
  ST_CAR        = 3
  ST_TRAIN      = 4
  ST_METROTRAIN = 7

  # =========================================================================
  # Generic task to load gtfs data.  Should be called from helper methods.
  # =========================================================================

  MSP_LRT_BLUE_STOPS  = Set.new [17875,17874,53221,53220,51423,51408,51424,51409,51425,51410,51411,51426,51427,51412,51413,51428,51429,51414,51430,51415,51416,51431,51432,51417,51433,51418,51419,51434,51435,51420,53280,53279,51421,51436,51422,51437,51405, 55999, 55998, 55994, 55997]
  MSP_LRT_GREEN_STOPS = Set.new [56043, 56001, 56002, 56042, 56003, 56041, 56040, 56004, 56005, 56039, 56038, 56006, 56007, 56037, 56036, 56008, 56035, 56009, 56034, 56010, 56033, 56011, 56032, 56012, 56013, 56031, 56014, 56030, 56015, 56029, 56016, 56028, 56017, 56027, 56026]
  MSP_HIAWATHA_STOPS  = Set.new [53342,53343,53352,53351,53344,53350,53345,56098,56097,53346,53349,53347,53348]

  SEATTLE_LINK_STOPS = Set.new [1109,1108,1122,1121,456,455,566,565,502,501,533,532,624,623,622,621,99101,99260,99111,99256,99121,99240,55860,55949,55778,56039,56159,55656,56173,55578,99900,99905,99904,99903,1630,26680,1619,26689,26665,26690,26645,26693,26698,26641,26702,26705,26700, 26701]

  def GetStopType(source_name, default_type, stopid)
    stopidi = stopid.to_i
    case source_name
    when "CHICAGO"
      if(0<=stopidi and stopidi<=29999)
        return ST_BUS
      elsif(30000<=stopidi and stopidi<=39999)
        return ST_IGNORE
      elsif(40000<=stopidi and stopidi<=49999)
        return ST_METROTRAIN
      end
    when "MSP"
      if MSP_LRT_BLUE_STOPS.include?(stopidi) or MSP_LRT_GREEN_STOPS.include?(stopidi) or MSP_HIAWATHA_STOPS.include?(stopidi)
        return ST_METROTRAIN
      else
        return ST_BUS
      end
    when "SEATTLE"
      if SEATTLE_LINK_STOPS.include?(stopidi)
        return ST_METROTRAIN
      else
        return ST_BUS
      end
    when "SOUNDTRANSIT"
      if !stopid.nil? and stopid.include?('C_')
        ST_IGNORE
      else
        return ST_METROTRAIN
      end
    else
      return ST_BUS
    end
  end

  task :load_gtfs_stops, [:source_name, :source_id, :path, :replace_column, :stop_type] => :environment do |t, args|
    require 'csv'

    start = Time.now

    begin
      file = File.read(Rails.root.join(args.path, 'stops.txt'))
    rescue
      raise "Error: No file found. #{args.path}/stops.txt"
    end

    # Remove all previous rows.
    Stop.delete_all(["source_id = ?", args.source_id])

    # Delete all stops from mongo for source
    Mongo::Stop.delete_all(source_id: args.source_id)

    # Lookup the source name to use for pretty urls.
    #source_name = Source.find(args.source_id).name
    transit_systems = Omgtransit::TransitSystems.new
    source_name = transit_systems.get_transit_system_by_id(args.source_id).first['name']

    puts 'Reading stops.txt file'
    puts "Adding/Updating Stops for #{args.path}"

    batch = []
    s_batch = []
    batch_size = 1000
    csv = CSV.parse(file, headers: true) do |row|
      stop_type = GetStopType(source_name, stop_type, row['stop_id'])

      if(stop_type==ST_IGNORE)
        next
      end

      stop_code = row['stop_id']
      unless row['stop_code'].blank?
        stop_code = row['stop_code']
      end

      # unless row['stop_name'].nil?
      #   row['stop_name'] = row['stop_name'].titleize
      # end
      unless row['stop_lat'].nil?
        s_batch << Stop.new({
          id:        "#{args.source_id}-#{row['stop_id']}",
          stop_id:   row['stop_id'],
          source_id: args.source_id,
          stop_code: row['stop_code'],
          stop_name: row['stop_name'],
          stop_desc: row['stop_desc'],
          stop_lat:  row['stop_lat'],
          stop_lon:  row['stop_lon'],
          zone_id:   row['zone_id'],
          stop_url:  "#{source_name}/#{stop_code}",
          stop_type: stop_type
        })

        batch << {
          combined_id: "#{args.source_id}-#{row['stop_id']}",
          stop_id:  row['stop_id'],
          stop_url: "#{source_name}/#{stop_code}",
          source_id: args.source_id,
          stop_desc: row['stop_desc'],
          stop_name: row['stop_name'],
          stop_type: stop_type,
          location: [row['stop_lat'].strip.to_f, row['stop_lon'].strip.to_f]
        }
      end

      if batch.size >= batch_size
        Stop.import s_batch
        Mongo::Stop.create!(batch)
        batch = []
        s_batch = []
      end
    end
    Stop.import s_batch
    Mongo::Stop.create!(batch)

    execution_time_in_seconds = Time.now - start
    puts "** Stops reload (#{execution_time_in_seconds})s @ #{DateTime.now} **"
  end

  task :load_gtfs_stop_times, [:source_id, :path] => :environment do |t, args|
    require 'csv'

    start = Time.now
    puts "** Updating Stop times for source_id #{args.source_id} **"


    puts "Deleting Stop Times for source_id #{args.source_id}"
    ActiveRecord::Base.connection.execute("
      DELETE FROM stop_times WHERE source_id = #{args.source_id}
    ")

    file_name = Rails.root.join(args.path, 'stop_times.txt')
    file = File.open(file_name, 'r')

    puts "Inserting stop times for source_id #{args.source_id}"

    # Setup connection
    conn = ActiveRecord::Base.connection
    rc = conn.raw_connection
    rc.exec("COPY stop_times (source_id, trip_id, arrival_time, departure_time, stop_id, stop_sequence) FROM STDIN WITH CSV")

    # Skip past header row..
    file.readline

    # Read all lines to stdin
    while !file.eof?
      rc.put_copy_data("#{file.readline.split(',')[0..4].join(',').prepend("#{args.source_id},")}\n")
    end

    rc.put_copy_end
    while res = rc.get_result
      if e_message = res.error_message
        p e_message
      end
    end

    execution_time_in_seconds = Time.now - start
    puts "** StopTimes reload (#{execution_time_in_seconds})s @ #{DateTime.now} **"
  end

  task :load_gtfs_trips, [:source_id, :path] => :environment do |t, args|
    require 'csv'
    start = Time.now
    puts "Deleting trips for source_id #{args.source_id}"
    ActiveRecord::Base.connection.execute("
      DELETE FROM trips WHERE source_id = #{args.source_id}
    ")

    puts "Adding Trips for source_id = #{args.source_id}"
    batch = []
    batch_size = 1000
    csv = CSV.parse(File.read(Rails.root.join(args.path, 'trips.txt')), headers: true) do |row|
      batch << Trip.new({
        :id                    => "#{args.source_id}-#{row['route_id']}-#{row['service_id']}-#{row['trip_id']}",
        :source_id             => args.source_id,
        :route_id              => row['route_id'],
        :service_id            => row['service_id'],
        :trip_id               => row['trip_id'],
        :trip_headsign         => row['trip_headsign'],
        :block_id              => row['block_id'],
        :shape_id              => row['shape_id'],
        :wheelchair_accessible => row['wheelchair_accessible'],
        :direction_id          => row['direction_id']
      })

      if batch.size >= batch_size
        Trip.import batch
        batch = []
      end
    end
    Trip.import batch

    execution_time_in_seconds = Time.now - start
    puts "** Trips reload (#{execution_time_in_seconds})s @ #{DateTime.now} **"
  end

  task :load_gtfs_routes, [:source_id, :path] => :environment do |t, args|
    require 'csv'

    puts "Deleting routes for source_id #{args.source_id}"
    ActiveRecord::Base.connection.execute("
      DELETE FROM routes WHERE source_id = #{args.source_id}
    ")

    puts "Adding routes for source_id = #{args.source_id}"
    csv = CSV.parse(File.read(Rails.root.join(args.path, 'routes.txt')), headers: true) do |row|
      Route.create!({
        :id               => "#{args.source_id}-#{row['route_id']}-#{row['agency_id']}",
        :source_id        => args.source_id,
        :route_id         => row['route_id'],
        :agency_id        => row['agency_id'],
        :route_short_name => row['route_short_name'],
        :route_long_name  => row['route_long_name'],
        :route_desc       => row['route_desc'],
        :route_type       => row['route_type'],
        :route_url        => row['route_url'],
        :route_color      => row['route_color'],
        :route_text_color => row['route_text_color']
      })
    end
  end

  task :load_gtfs_calendar, [:source_id, :path] => :environment do |t, args|
    require 'csv'

    puts "Deleting routes for source_id #{args.source_id}"
    ActiveRecord::Base.connection.execute("
      DELETE FROM calendars WHERE source_id = #{args.source_id}
    ")

    puts "Adding calendar for source_id = #{args.source_id}"
    csv = CSV.parse(File.read(Rails.root.join(args.path, 'calendar.txt')), headers: true) do |row|
      Calendar.create!({
        :id         => "#{args.source_id}-#{row['service_id']}",
        :source_id  => args.source_id,
        :service_id => row['service_id'],
        :monday     => row['monday'],
        :tuesday    => row['tuesday'],
        :wednesday  => row['wednesday'],
        :thursday   => row['thursday'],
        :friday     => row['friday'],
        :saturday   => row['saturday'],
        :sunday     => row['sunday'],
        :start_date => row['start_date'],
        :end_date   => row['end_date']
      })
    end
  end

  task :load_gtfs_shapes, [:source_id, :path] => :environment do |t, args|
    require 'csv'

    puts "**** Shapes addition for source_id = #{args.source_id} ****"
    start = Time.now

    file_name = Rails.root.join(args.path, 'shapes.txt')
    file = File.open(file_name, 'r')

    puts "Deleting shapes for source_id #{args.source_id}"
    ActiveRecord::Base.connection.execute("
      DELETE FROM shapes WHERE source_id = #{args.source_id}
    ")

    # Setup connection
    conn = ActiveRecord::Base.connection
    rc = conn.raw_connection
    rc.exec("COPY shapes (source_id, shape_id, shape_pt_lat, shape_pt_lon, shape_pt_sequence) FROM STDIN WITH CSV")

    # Skip past header row..
    file.readline

    # Read all lines to stdin
    while !file.eof?
      rc.put_copy_data("#{file.readline.prepend("#{args.source_id},")}")
    end

    rc.put_copy_end
    while res = rc.get_result
      if e_message = res.error_message
        p e_message
      end
    end

    execution_time_in_seconds = Time.now - start
    puts "**** Shapes reload (#{execution_time_in_seconds})s @ #{DateTime.now} ****"
  end

  # ================================================================
  # Reload individual cities gtfs based on the tasks above.
  # ================================================================
  # Run all tables using, e.g., rake "omgtransit:load_gtfs[AMTRAK]"
  # To run a specific table, rake "omgtransit:load_gtfs[MSP, STOPS]"

  task :load_gtfs, [:which_gtfs, :table_name] => :environment do |t, args|
    start = Time.now
    source = Source.find_by_name(args.which_gtfs.upcase)
    
    transit_systems = Omgtransit::TransitSystems.new
    source = transit_systems.get_transit_system_by_name(args.which_gtfs.upcase).first

    if source.nil?
      puts '** Note: There was no source definition for this task. Please add a source to the seeds file and run rake db:seed'
      next
    elsif source['stopparser'] != 'gtfs'
      puts '** Note: This source cannot be parsed as GTFS'
      next
    end

    #TODO (from Richard): Maybe this should be saved to '/etc/omgtransit/' or '/tmp/'
    source_name = source['name'].gsub(/ /,'')
    zippath = Rails.root.join('setup',source_name+'_gtfs.zip')
    folder_path = "setup/#{source_name}_gtfs"

    #Download only if it isn't there or hasn't been updated in a day
    if not File.exist?(zippath) or Time.now()-File.mtime(zippath)>=3600*24
      puts "Acquiring zip file from '#{source['stopdata']}' and saving to '#{zippath}'"
      system("wget -nv #{source['stopdata']} -O #{zippath}")
      puts 'Acquired zip file.'
      puts 'Deflating.'
      system("unzip #{zippath} -d #{folder_path}")
    else
      puts 'A recent download of this data source has been found. Loading it.'
    end

    if args.table_name.nil? || args.table_name.upcase == "STOPS"
      Rake::Task['omgtransit:load_gtfs_stops'].invoke(args.which_gtfs.upcase, source['id'], folder_path, 'stop_id', source['transit_type'])
    end

    if args.table_name.nil? || args.table_name.upcase == "STOP_TIMES"
      Rake::Task['omgtransit:load_gtfs_stop_times'].invoke(source['id'], folder_path)
    end

    if args.table_name.nil? || args.table_name.upcase == "TRIPS"
      Rake::Task['omgtransit:load_gtfs_trips'].invoke(source['id'], folder_path)
    end

    if args.table_name.nil? || args.table_name.upcase == "ROUTES"
      Rake::Task['omgtransit:load_gtfs_routes'].invoke(source['id'], folder_path)
    end

    if args.table_name.nil? || args.table_name.upcase == "CALENDAR"
      Rake::Task['omgtransit:load_gtfs_calendar'].invoke(source['id'], folder_path)
    end

    if args.table_name.nil? || args.table_name.upcase == "SHAPES"
      Rake::Task['omgtransit:load_gtfs_shapes'].invoke(source['id'], folder_path)
    end

    execution_time_in_seconds = Time.now - start
    puts "**** GTFS reload (#{execution_time_in_seconds})s @ #{DateTime.now} ****"
  end




  # ================================================================
  # RELOAD EVERYTHING: Major database changes only
  # ================================================================

  task :reload_everything => :environment do
    Rake::Task['omgtransit:load_gtfs'].invoke('MSP')
    Rake::Task['omgtransit:load_umn_stops'].invoke()
    Rake::Task['omgtransit:reload_car2go'].invoke()
    Rake::Task['omgtransit:load_gtfs'].invoke('AMTRAK')
  end
end
