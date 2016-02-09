namespace :omgtransit do

  require 'nokogiri'
  require 'httparty'

  ST_METROTRAIN = 7

  task :load_bart => :environment do
    source = Source.find_by_name('bart')
    if source.nil?
      puts '** Note: There was no source definition for this task. Please add a source to the seeds file and run rake db:seed'
      next
    end

    puts 'Eliminating old BART stops'
    Stop.delete_all(["source_id = ?", source.id])
    Mongo::Stop.delete_all(source_id: source.id)

    url="http://api.bart.gov/api/stn.aspx?cmd=stns&key=#{ENV['bart_key']}"
    data=Nokogiri::XML(HTTParty.get(url).body)

    s_batch = []
    batch = []

    puts 'Parsing BART stops'
    data.xpath('/root/stations/station').each do |station|
      s_batch << Stop.new({
        id:            "#{source.id}-" + station.xpath('abbr').text,
        stop_id:       station.xpath('abbr').text,
        source_id:     source.id,
        stop_name:     station.xpath('name').text,
        stop_city:     station.xpath('city').text,
        stop_street:   station.xpath('address').text,
        stop_region:   station.xpath('state').text,
        stop_postcode: station.xpath('zipcode').text,
        stop_lat:      station.xpath('gtfs_latitude').text,
        stop_lon:      station.xpath('gtfs_longitude').text,
        stop_url:      "#{source.name}/" + station.xpath('abbr').text,
        stop_type:     ST_METROTRAIN,
        updated:       Time.now.to_i
      })

      batch << {
        combined_id: "#{source.id}-#{station.xpath('abbr').text.downcase}",
        stop_id:  "#{station.xpath('abbr').text.downcase}",
        stop_url: "#{source.name}/#{station.xpath('abbr').text}",
        source_id: source.id,
        stop_desc: "#{station.xpath('name').text}",
        stop_name: "#{station.xpath('name').text}",
        stop_type: ST_METROTRAIN,
        updated: Time.now.to_i,
        location: [station.xpath('gtfs_latitude').text.to_s.strip.to_f, station.xpath('gtfs_longitude').text.to_s.strip.to_f]
      }
    end

    puts "Loaded #{s_batch.length} BART stops"

    Stop.import s_batch
    Mongo::Stop.create!(batch)

  end

end