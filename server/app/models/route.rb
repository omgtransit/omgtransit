class Route < ActiveRecord::Base
  attr_accessible :id, :agency_id, :route_color, :route_desc, :route_id, :route_long_name, :route_short_name, :route_text_color, :route_type, :route_url, :source_id
end
