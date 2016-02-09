namespace :omgtransit do
  require 'httparty'
  require 'json'

  task :load_airports => :environment do
    source = Source.find_by_stopparser('flightstats')
    if source.nil?
      puts '** Note: There was no source definition for this task. Please add a source to the seeds file and run rake db:seed'      
      next
    end

    puts "Downloading stops data for #{source.name}"
    data=HTTParty.get(source.stopdata).body
    data=JSON.parse(data)

    puts 'Clearing old data'
    Stop.delete_all(["source_id = ?", source.id])
    Mongo::Stop.delete_all(source_id: source.id)

    puts 'Parsing airports'
    data['airports'].each do |stop|
      #TODO: There seems to be no way to see when the station info was last updated

      Stop.skip_callback(:save, :after)
      Stop.create!({
        id:           "#{source.id}-#{stop['fs']}",
        stop_id:      "#{stop['fs']}",
        source_id:    source.id,
        stop_name:    "#{stop['name']}",
        stop_lat:     "#{stop['latitude']}",
        stop_lon:     "#{stop['longitude']}",
        stop_city:    "#{stop['city']}",
        stop_country: "#{stop['countryName']}",
        stop_url:     "#{source.name}/#{stop['fs']}",
        stop_type:    source.transit_type
      })

      Mongo::Stop.create!({
        combined_id: "#{source.id}-#{stop['fs']}",
        stop_id:  "#{stop['fs']}",
        stop_url: "#{source.name}/#{stop['fs']}",
        source_id: source.id,
        stop_desc: "#{stop['name']}",
        stop_name: "#{stop['name']}",
        stop_country: "#{stop['countryName']}",
        stop_type: source.transit_type,
        location: [stop['latitude'].to_s.strip.to_f, stop['longitude'].to_s.strip.to_f]
      })
    end
  end

end
