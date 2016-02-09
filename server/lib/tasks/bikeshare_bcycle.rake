namespace :omgtransit do
  require 'httparty'
  require 'json'

  task :load_bcycles => :environment do
    source = Source.find_by_name('Bcycle')
    if source.nil?
      puts '** Note: There was no source definition for this task. Please add a source to the seeds file and run rake db:seed'      
      return
    end

    programs_url = 'https://publicapi.bcycle.com/api/1.0/ListPrograms'
    kiosks_url   = 'https://publicapi.bcycle.com/api/1.0/ListProgramKiosks/{id}'
    headers      = {
      'ApiKey'        => "#{ENV['bcycle_key']}",
      'Cache-Control' => 'no-cache'
    }


    puts 'Clearing old data'
    Stop.delete_all(["source_id = ?", source.id])
    Mongo::Stop.delete_all(source_id: source.id)

    puts "Downloading stops data for #{source.name}"
    data=HTTParty.get(programs_url, :headers=>headers).body
    data=JSON.parse(data)

    puts 'Parsing Bcycle bike programs'
    data.each do |program|
      stops = []
      batch = []

      puts "Gathering stops for: " + program['Name']

      stopdataurl = kiosks_url.gsub('{id}',program['ProgramId'].to_s)
      stopdata    = HTTParty.get(stopdataurl, :headers=>headers).body
      stopdata    = JSON.parse(stopdata)

      stopdata.each do |stop|

        #TODO: This also includes a isEvent thing indicating if the stop is
        #temporary and an hours of operation thing and a status thing.
        stops << Stop.new({
          id:            "#{source.id}-#{stop['Id']}", #Id is unique across all programs
          stop_id:       stop['Id'],
          source_id:     source.id,
          stop_name:     stop['Name'],
          stop_street:   stop['Address']['Street'],
          stop_city:     stop['Address']['City'],
          stop_region:   stop['Address']['State'],
          stop_postcode: stop['Address']['ZipCode'],
          stop_country:  stop['Address']['Country'],
          stop_lat:      stop['Location']['Latitude'],
          stop_lon:      stop['Location']['Longitude'],
          stop_url:      "#{source.name}/#{stop['Id']}",
          stop_type:     source.transit_type
        })

        batch << {
          combined_id: "#{source.id}-#{stop['Id']}",
          stop_id:  "#{stop['Id']}",
          stop_url: "#{source.name}/#{stop['Id']}",
          source_id: source.id,
          stop_desc: "#{stop['Name']}",
          stop_name: "#{stop['Name']}",
          stop_type: source.transit_type,
          location: [stop['Location']['Latitude'].to_s.strip.to_f, stop['Location']['Longitude'].to_s.strip.to_f]
        }

      end

      Stop.import stops
      Mongo::Stop.create!(batch)
      
    end
  end

end
