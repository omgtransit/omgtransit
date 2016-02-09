namespace :omgtransit do
  require 'httparty'
  require 'json'

  task :load_cyclocitys => :environment do
    source = Source.find_by_name('CycloCity')
    if source.nil?
      puts '** Note: There was no source definition for this task. Please add a source to the seeds file and run rake db:seed'      
      return
    end

    puts 'Clearing old data'
    Stop.delete_all(["source_id = ?", source.id])
    Mongo::Stop.delete_all(source_id: source.id)

    locations_url = "https://api.jcdecaux.com/vls/v1/contracts?apiKey=#{ENV['cyclo_key']}"

    puts "Downloading contracts data for #{source.name}"
    data = HTTParty.get(locations_url).body
    data = JSON.parse(data)

    data.each do |contract|
      puts "Downloading stops data for #{contract['name']}"
      url="https://api.jcdecaux.com/vls/v1/stations?apiKey=#{ENV['cyclo_key']}&contract={contract}".gsub('{contract}',contract['name'])
      s_batch = []
      batch = []

      contractdata=HTTParty.get(url).body
      contractdata=JSON.parse(contractdata)
      contractdata.each do |stop|
        s_batch << Stop.new({
          id:            "#{source.id}-#{contract['name']}-#{stop['number']}",
          stop_id:       "#{stop['number']}",
          source_id:     source.id,
          stop_name:     "#{stop['name']}",
          stop_lat:      "#{stop['position']['lat']}",
          stop_lon:      "#{stop['position']['lng']}",
          stop_street:   "#{stop['address']}",
          stop_city:     "#{contract['name']}",
          stop_country:  "#{contract['country_code']}",
          stop_url:      "#{source.name}/#{contract['name']}-#{stop['number']}",
          stop_type:     source.transit_type
        })

        batch << {
          combined_id: "#{source.id}-#{contract['name']}-#{stop['number']}",
          stop_id:  "#{stop['number']}",
          stop_url: "#{source.name}/#{contract['name']}-#{stop['number']}",
          source_id: source.id,
          stop_desc: "#{stop['name']}",
          stop_name: "#{stop['name']}",
          stop_type: source.transit_type,
          location: [stop['position']['lat'].to_s.strip.to_f, stop['position']['lng'].to_s.strip.to_f]
        }
      end

      Stop.import s_batch
      Mongo::Stop.create!(batch)
    end
  end

end
