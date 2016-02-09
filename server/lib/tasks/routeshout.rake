namespace :omgtransit do
  require 'httparty'
  require 'json'

  APIKEY = "#{ENV['routeshout_key']}"

  task :load_routeshout => :environment do
    puts "Downloading agencies data for RouteShout"

    #TODO (from Richard): This is not yet working on account of the ridiculous
    #stop ids that RouteShout uses.

    agency_url = "http://api.routeshout.com/v1/rs.agencies.getList?key=#{APIKEY}"
    agencies = JSON.parse(HTTParty.get(agency_url).body)
    count = agencies['response'].count

    defsfile = File.open(Rails.root.join('../transit_defs.json'),"rb")
    contents = defsfile.read
    contents = JSON.parse(contents)['transit_systems']

    routeshout_sources = contents.select { |n| n['parser'] == 'routeshout' }

    puts "Agency Count #{count}"
    puts "Transit Defs Count #{routeshout_sources.count}"

    routeshout_sources.each do |agency|
      if agency['ignore']
        puts "Ignoring data for #{agency['name']} "
        next
      end

      puts "Clearing old data for #{agency['name']}"
      Stop.delete_all(["source_id = ?", agency['id']])
      Mongo::Stop.delete_all(source_id: agency['id'])


      puts "Downloading stops data for #{agency['name']}"
      url="http://api.routeshout.com/v1/rs.stops.getList?key=#{APIKEY}&agency=#{agency['name']}"
      puts url
      stops=HTTParty.get(url).body
      stops=JSON.parse(stops)

      s_batch = []
      batch = []
      
      stops['response'].each do |stop|
        stopid=URI.escape("#{stop['id']}")
        
        s_batch << Stop.new({
          id:            "#{agency['id']}-#{stopid}",
          stop_id:       "#{stopid}",
          source_id:     agency['id'],
          stop_name:     "#{stop['name']}".titleize,
          stop_lat:      "#{stop['lat']}",
          stop_lon:      "#{stop['lon']}",
          # TODO: (Richard) We should add back the city.
          #stop_city:     "#{agency['title']}",
          stop_region:   "#{agency['state']}",
          stop_url:      "#{agency['name']}/#{stopid}",
          # TODO: (Jason) Change this to the stop type later.
          stop_type:     1
        })

        batch << {
          combined_id: "#{agency['id']}-#{stopid}",
          stop_id:  "#{stopid}",
          stop_url: "#{agency['name']}/#{stopid}",
          source_id: agency['id'],
          stop_desc: "#{stop['name'].to_s.titleize}",
          stop_name: "#{stop['name'].to_s.titleize}",
          stop_region:   "#{agency['state']}",
          stop_type: 1,
          location: [stop['lat'].to_s.strip.to_f, stop['lon'].to_s.strip.to_f]
        }
      end

      Stop.import s_batch
      Mongo::Stop.create!(batch)

    end
  end

end
