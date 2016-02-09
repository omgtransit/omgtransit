namespace :omgtransit do
  require 'httparty'
  require 'omgtransit/transit_systems'

  INDEX_NAME = "omgtransit_stops"

  # =================================================
  # Pronto - Seattle Bikeshare
  # =================================================

  task :reload_pronto => :environment do |t, args|
    PRONTO_STATION_URL = 'https://secure.prontocycleshare.com/data2/stations.json'
    start = Time.now

    transit_systems = Omgtransit::TransitSystems.new
    source = transit_systems.get_transit_system_by_name('PRONTO').first
    source_id = source['id']

    data = HTTParty.get(PRONTO_STATION_URL)['stations']
    batch = []
   
    data.each do |stop|
      batch << {
        combined_id: "#{source['id']}-#{stop['id']}",
        stop_id:   "#{stop['id']}",
        stop_url:  "#{source['name']}/#{stop['id']}",
        source_id: source['id'],
        stop_desc: "#{stop['s']}",
        stop_name: "#{stop['s']}",
        stop_type: 2,
        location: [stop['la'].to_s.strip.to_f, stop['lo'].to_s.strip.to_f]
      }
    end  

    Mongo::Stop.delete_all(source_id: source_id)
    Mongo::Stop.create!(batch)

    execution_time_in_seconds = Time.now - start
    puts "** Pronto reload (#{execution_time_in_seconds})s @ #{DateTime.now} **"
  end
end