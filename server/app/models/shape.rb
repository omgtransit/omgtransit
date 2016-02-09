class Shape < ActiveRecord::Base
  attr_accessible :shape_pt_lat, :shape_pt_lon

  def location
    [shape_pt_lon.to_f, shape_pt_lat.to_f]
  end

  def maps_location
    [shape_pt_lat.to_f, shape_pt_lon.to_f]
  end

  def self.encode_to_polylines(source_id, shape_id)
    m = where({:source_id => source_id, :shape_id => shape_id}).map { |i| [i[:shape_pt_lat], i[:shape_pt_lon]]}
    Polylines::Encoder.encode_points(m)
  end

end