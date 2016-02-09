namespace :omgtransit do
  require 'httparty'

  INDEX_NAME = "omgtransit_stops"

  # =================================================
  # Zipcar
  # =================================================

  task :reload_zipcar => :environment do |t, args|
    ZIPCAR_FLEET_URL = 'http://www.zipcar.com/api/drupal/1.0/fleets/'

    start = Time.now
    
    transit_systems = Omgtransit::TransitSystems.new
    source_id = transit_systems.get_transit_system_by_name('ZIPCAR').first['id']
    locations = []

    fleets = HTTParty.get(ZIPCAR_FLEET_URL).parsed_response['fleets']
    fleets.each do |f|
      fleet = f['fleet']
      if (fleet['locale'] == 'en-US')

        puts "- Loading Fleet - #{fleet['fleet_name']}"
        location_url = "http://www.zipcar.com/api/drupal/1.0/locations?lat=#{fleet['latitude']}&lon=#{fleet['longitude']}&lat_delta=0.3&lon_delta=0.3&locale=en-US"
        response = HTTParty.get(location_url).parsed_response['locations']

        unless response.nil?
          response.each do |stop|
            locations << {
                combined_id: "#{source_id}-#{stop['locationId']}",
                type:        'stop',
                stop_id:     stop['locationId'],
                source_id:   source_id,
                stop_name:   stop['description'],
                stop_city:   f['fleet_name'],
                stop_url:    "zipcar/#{stop['locationId']}",
                stop_region: stop['region_name'],
                location:    [stop['latitude'].to_f, stop['longitude'].to_f],
                stop_type:   6 #TODO(Richard): Refer to transit_defs for this
              }
          end
        end
      end
    end

    locations.uniq!

    Mongo::Stop.delete_all(source_id: source_id)
    Mongo::Stop.create!(locations)

    execution_time_in_seconds = Time.now - start
    puts "** Zipcar reload (#{execution_time_in_seconds})s @ #{DateTime.now} **"
  end
end