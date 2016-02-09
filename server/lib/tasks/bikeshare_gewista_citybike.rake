namespace :omgtransit do
  require 'nokogiri'
  require 'httparty'

  task :load_gewista_citybikes => :environment do
    source = Source.find_by_stopparser('gewista_citybike')
    if source.nil?
      puts '** Note: There was no source definition for this task. Please add a source to the seeds file and run rake db:seed'      
      next
    end

    puts "Downloading stops data for #{source.name}"
    data=Nokogiri::XML(HTTParty.get(source.stopdata).body)

    puts 'Clearing old data'
    Stop.delete_all(["source_id = ?", source.id])
    Mongo::Stop.delete_all(source_id: source.id)

    puts 'Parsing bike stations'
    data.xpath('//station').each do |stop|

      stop_id   = stop.xpath('id'  ).text
      title     = stop.xpath('name').text
      desc      = stop.xpath('description').text
      latitude  = stop.xpath('latitude' ).text
      longitude = stop.xpath('longitude').text

      Stop.skip_callback(:save, :after)
      Stop.create!({
        id:        "#{source.id}-#{stop_id}",
        stop_id:   "#{stop_id}",
        source_id: source.id,
        stop_name: "#{title}",
        stop_desc: "#{desc}",
        stop_lat:  "#{latitude}",
        stop_lon:  "#{longitude}",
        stop_url:  "#{source.name}/#{stop_id}",
        url:       source.realtime_url.gsub('{stop_id}', "#{stop_id}"),
        stop_type: source.transit_type
      })

      Mongo::Stop.create!({
        combined_id: "#{source.id}-#{stop_id}",
        stop_id:  "#{stop_id}",
        stop_url: "#{source.name}/#{stop_id}",
        source_id: source.id,
        stop_desc: "#{title}",
        stop_name: "#{title}",
        stop_type: source.transit_type,
        location: [latitude.to_s.strip.to_f, longitude.to_s.strip.to_f]
      })
    end
  end


  task :update_gewista_citybike_info => :environment do
    source = Source.find_by_stopparser('gewista_citybike')
    if source.nil?
      puts '** Note: There was no source definition for this task. Please add a source to the seeds file and run rake db:seed'      
      next
    end

    puts "Downloading stops data for #{source.name}"
    data=Nokogiri::XML(HTTParty.get(source.stopdata).body)

    puts 'Parsing bike stations'
    data.xpath('//station').each do |stop|
      stop_id      = stop.xpath('id'  ).text
      nbBikes      = stop.xpath('free_bikes').text
      nbEmptyDocks = stop.xpath('free_boxes').text
      $redis.set "#{source.id}-#{stop_id}", {:nbBikes=>nbBikes, :nbEmptyDocks=>nbEmptyDocks}.to_json
    end
  end

end
