class Mongo::Stop
  include Mongoid::Document

  field :combined_id, type: String
  field :stop_id, type: String
  field :stop_url, type: String
  field :source_id, type: Integer
  field :stop_desc, type: String
  field :stop_name, type: String
  field :stop_city, type: String
  field :stop_street, type: String
  field :stop_code, type: String
  field :stop_type, type: Integer
  field :location, type: Array

  index({ location: "2d" }, { min: -180, max: 180 })
  index({ source_id: 1})

  store_in collection: "mongo_stops", database: "omgtransit"
end