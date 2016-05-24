module Omgtransit
  class TransitSystems
    def initialize
      defsfile = File.open('/data/transit_defs.json',"rb")
      contents = defsfile.read
      @contents = JSON.parse(contents)
    end

    def get_transit_system_by_name(transit_system_name)
      @contents["transit_systems"].select{|value| value["name"] == transit_system_name}
    end

    def get_transit_system_by_id(transit_system_id)
      @contents["transit_systems"].select{|value| value["id"] == transit_system_id}
    end

  end
end