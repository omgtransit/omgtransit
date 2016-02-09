namespace :omgtransit do
  require 'rubygems'
  require 'bundler'
  Bundler.setup
  require 'nokogiri'
  require 'httparty'

  # =========================================================================
  # Stop type constants (yes they are constants you don't need to check):
  # =========================================================================
  
  ST_BUS   = 1
  ST_BIKE  = 2
  ST_CAR   = 3
  ST_TRAIN = 4

  module Nextbus
    class Route
      attr_accessor :xml_data, :stops, :list_url, :config_url

      def initialize(route, agency_name)
        @xml_data = route
        @stops = []
        @config_url = "http://webservices.nextbus.com/service/publicXMLFeed?command=routeConfig&a=#{agency_name}&r="

        get_route_config.xpath('/body/route/stop').each do |s| 
          stops << Stop.new(s)
        end
      end

      def self.get_routes(agency_name)
        get_route_list(agency_name).xpath('//route').map do |route| 
          new(route, agency_name)
        end
      end

      def self.get_route_list(agency_name)
        list_url = "http://webservices.nextbus.com/service/publicXMLFeed?command=routeList&a=#{agency_name}"
        Nokogiri::XML(HTTParty.get(list_url).body)
      end

      def get_route_config
        Nokogiri::XML(HTTParty.get(@config_url + @xml_data.attributes['tag'].value.delete(' ')).body)
      end
    end

    class Stop
      attr_accessor :xml_data, :stop_id, :title, :short_title, :latitude, :longitude

      def initialize(stop)
        @xml_data    = stop
        @stop_id     = xml_data.attributes['stopId']
        @title       = xml_data.attributes['title']
        @short_title = xml_data.attributes['shortTitle']
        @latitude    = xml_data.attributes['lat']
        @longitude   = xml_data.attributes['lon']
      end
    end
  end

  task :load_nextbus_stops,[:source_name, :agency_name, :logo] => :environment do |t, args|
    
    source = Source.find_by_name(args.source_name)

    unless source.nil?
      Stop.delete_all("source_id = #{source.id}")
      
      # Delete all stops from mongo for source
      Mongo::Stop.delete_all(source_id: source.id)

      s_batch = []
      batch = []
      
      Nextbus::Route.get_routes(args.agency_name).each do |route|
        st = {}

        route.stops.each do |stop|
          id = "#{source.id}-#{stop.stop_id}"
          

          # s = Stop.find_by_id(id)
          # if s.nil?
          if st[id].nil?
            s_batch << Stop.new({
              id:        id,
              stop_id:   "#{stop.stop_id}",
              source_id: source.id,
              stop_name: "#{stop.title}",
              stop_desc: "#{stop.title}",
              stop_lat:  "#{stop.latitude}",
              stop_lon:  "#{stop.longitude}",
              stop_url:  "#{args.source_name}/#{stop.stop_id}",
              stop_type: ST_BUS
            })
            batch << {
              combined_id: "#{source.id}-#{stop.stop_id}",
              stop_id:  "#{stop.stop_id}",
              stop_url: "#{args.source_name}/#{stop.stop_id}",
              source_id: source.id,
              stop_desc: "#{stop.title}",
              stop_name: "#{stop.title}",
              stop_type: ST_BUS,
              location: [stop.latitude.to_s.strip.to_f, stop.longitude.to_s.strip.to_f]
            }
            st[id] = id
          end
        end
      end

      s_batch.uniq!
      batch.uniq!
      Stop.import s_batch
      Mongo::Stop.create!(batch)
      
    else
      puts '** Note: There was no source definition for this task. Please add a source to the seeds file and run rake db:seed'
    end

  end

  task :reload_nextbus do
    Rake::Task['omgtransit:load_umn'].invoke()
    Rake::Task['omgtransit:load_portland_streetcar'].invoke()
    Rake::Task['omgtransit:load_ames_iowa'].invoke()
  end

  task :reload_all_nextbus do
    agency_url = "http://webservices.nextbus.com/service/publicXMLFeed?command=agencyList"
    agencies = Nokogiri::XML(HTTParty.get(agency_url).body)
    count = agencies.xpath('/body/agency').count

    defsfile = File.open(Rails.root.join('../transit_defs.json'),"rb")
    contents = defsfile.read
    contents = JSON.parse(contents)['transit_systems']

    nextbus_sources = contents.select { |n| n['parser'] == 'nextbus' }

    puts "Agency Count #{count}"
    puts "Transit Defs Count #{nextbus_sources.count}"

    if count > nextbus_sources.count
      puts "Looks like there are some new nextbus agencies.  PLEASE ADD THEM TO transit_defs.json"
    end

    nextbus_sources.each_with_index do |s, i| 
      puts "Loading #{s['desc']}"
      if i == 0
        Rake::Task['omgtransit:load_nextbus_stops'].invoke(s['name'], s['agency_name'], '')
      else
        Rake::Task["omgtransit:load_nextbus_stops"].reenable
        Rake::Task['omgtransit:load_nextbus_stops'].invoke(s['name'], s['agency_name'], '')
      end
    end

    # agencies.xpath('/agency').each do |s| 
    #   stops << Stop.new(s)
    # end
  end

  task :load_umn do
    Rake::Task['omgtransit:load_nextbus_stops'].invoke('UMN', 'umn-twin', 'umn.png')
  end

  task :load_portland_streetcar do
    Rake::Task['omgtransit:load_nextbus_stops'].invoke('portland-sc', 'portland-sc', '')
  end

  task :load_ames_iowa do
    Rake::Task['omgtransit:load_nextbus_stops'].invoke('AMW', 'cyride', '')
  end

end
