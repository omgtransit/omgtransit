class Stop < ActiveRecord::Base

  self.primary_key = :id

  attr_accessible :id, :stop_id, :source_id, :stop_name, :stop_desc, :stop_lat, :stop_lon, :stop_city, :stop_street, :stop_type, :stop_code, :zone_id, :stop_url, :stop_region, :stop_postcode, :stop_country, :updated
  
  belongs_to :source
  has_many :favorites

  def location
    [stop_lon.to_f, stop_lat.to_f]
  end

end