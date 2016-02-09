class Mongo::Alert
  include Mongoid::Document

  field :alert_id, type: Integer
  field :alert_time, type: Float
  field :offset, type: Float
  field :start_time, type: Float
  field :device_token, type: String
  field :user_id, type: Integer
  field :realtime_url, type: String
  field :route, type: String
  field :stop_id, type: String
  field :platform, type: String
  field :recurring, type: Boolean
  field :stop_name, type: String
  field :recurring_days, type: String
  field :last_recurring_at, type: Date

  store_in collection: "mongo_alerts", database: "omgtransit"
end