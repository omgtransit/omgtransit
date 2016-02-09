namespace :omgtransit do
  require 'httparty'

  # =========================================================================
  # Stop type constants (yes they are constants you don't need to check):
  # =========================================================================
  
  ST_BUS        = 1
  ST_BIKE       = 2
  ST_CAR        = 3
  ST_TRAIN      = 4
  ST_METROTRAIN = 7

  task :reload_washingtondc => :environment do |t, args|
    source = Source.find_by_name('WASHINGTONDC')
    if source.nil?
      puts '** Note: There was no source definition for this task. Please add a source to the seeds file and run rake db:seed'      
      return
    end

    bus_stops_url   = "http://api.wmata.com/Bus.svc/json/JStops?api_key=#{ENV['wdc_key']}"
    train_stops_url = "http://api.wmata.com/Rail.svc/json/JStations?api_key=#{ENV['wdc_key']}"
    
    Stop.delete_all("source_id = #{source.id}")
    Mongo::Stop.delete_all(source_id: source.id)

    puts "Downloading bus stops data for #{source.name}"
    bstops=HTTParty.get(bus_stops_url).body
    bstops=JSON.parse(bstops)

    s_batch = []
    batch = []

    puts 'Adding stops'

    bstops['Stops'].each do |stop|
      if stop['StopID']=='0'
        next
      end

      s_batch << Stop.new({
        id:            "#{source.id}-#{stop['StopID']}", #Id is unique across all programs
        stop_id:       stop['StopID'],
        source_id:     source.id,
        stop_name:     stop['Name'],
        stop_city:     'Washington',
        stop_region:   'DC',
        stop_country:  'USA',
        stop_lat:      stop['Lat'],
        stop_lon:      stop['Lon'],
        stop_url:      "#{source.name}/#{stop['StopID']}",
        stop_type:     ST_BUS
      })

      batch << {
        combined_id: "#{source.id}-#{stop['StopID']}",
        stop_id:  "#{stop['StopID']}",
        stop_url: "#{source.name}/#{stop['StopID']}",
        source_id: source.id,
        stop_desc: "#{stop['Name']}",
        stop_name: "#{stop['Name']}",
        stop_city:     'Washington',
        stop_region:   'DC',
        stop_country:  'USA',
        stop_type: ST_BUS,
        location: [stop['Lat'].to_s.strip.to_f, stop['Lon'].to_s.strip.to_f]
      }
    end

    Stop.import s_batch
    Mongo::Stop.create!(batch)    






    puts "Downloading metro train data for #{source.name}"
    tstops=HTTParty.get(train_stops_url).body
    tstops=JSON.parse(tstops)

    s_batch = []
    batch = []

    puts 'Adding stops'

    tstops['Stations'].each do |stop|

      station_code=stop['Code']
      if stop['StationTogether2'].length!=0
        puts 'WashingtonDC has a stationtogether2 - we are not prepared for this!'
      end

      if stop['StationTogether1'].length!=0
        if stop['Code']<stop['StationTogether1']
          station_code+=','+stop['StationTogether1']
        else
          next
        end
      end

      s_batch << Stop.new({
        id:            "#{source.id}-#{station_code}", #Id is unique across all programs
        stop_id:       station_code,
        source_id:     source.id,
        stop_name:     stop['Name'] + ' Metro Station',
        stop_city:     'Washington',
        stop_region:   'DC',
        stop_country:  'USA',
        stop_lat:      stop['Lat'],
        stop_lon:      stop['Lon'],
        stop_url:      "#{source.name}/#{station_code}",
        stop_type:     ST_METROTRAIN
      })

      batch << {
        combined_id: "#{source.id}-#{station_code}",
        stop_id:  "#{station_code}",
        stop_url: "#{source.name}/#{station_code}",
        source_id: source.id,
        stop_desc: "#{stop['Name']}  Metro Station",
        stop_name: "#{stop['Name']}  Metro Station",
        stop_city:     'Washington',
        stop_region:   'DC',
        stop_country:  'USA',
        stop_type: ST_METROTRAIN,
        location: [stop['Lat'].to_s.strip.to_f, stop['Lon'].to_s.strip.to_f]
      }
    end

    Stop.import s_batch
    Mongo::Stop.create!(batch)

  end

end
