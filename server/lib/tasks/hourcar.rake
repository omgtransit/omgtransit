namespace :omgtransit do
  require 'httparty'
  require 'omgtransit/transit_systems'

  INDEX_NAME = "omgtransit_stops"

  # =================================================
  # Hourcar
  # =================================================

  task :reload_hourcar => :environment do |t, args|
    HOURCAR_FEED_URL = 'https://reserve.hourcar.org/maps/?format=json'

    start = Time.now

    transit_systems = Omgtransit::TransitSystems.new
    source_id = transit_systems.get_transit_system_by_name('HOURCAR').first['id']

    locations = []

    data = JSON.parse( HTTParty.get(HOURCAR_FEED_URL) )
    stops = data[0]
    cars = data[1]

    stops.each do |st|

      vehicles = []

      st['vehicle_types'].each do |v|
        vehicles << cars.select{|i| i['id'] == v}.first
      end

      locations << {
        combined_id: "#{source_id}-#{st['id']}",
        type: 'stop',
        stop_id: st['id'],
        source_id: source_id,
        stop_name: st['descr'],
        stop_url: "HOURCAR/#{st['id']}",
        location: [st['latitude'].to_f, st['longitude'].to_f],
        stop_type: 9,
        vehicle_types: vehicles
      }
    end

    Mongo::Stop.delete_all(source_id: source_id)
    Mongo::Stop.create!(locations)

    execution_time_in_seconds = Time.now - start
    puts "** Hourcar reload (#{execution_time_in_seconds})s @ #{DateTime.now} **"
  end
end