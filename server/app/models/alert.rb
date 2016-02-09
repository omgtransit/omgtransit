class Alert < ActiveRecord::Base
  attr_accessible :alert_time, :device_token, :realtime_url, :user_id, :route, :stop_id, :platform, :recurring, :stop_name, :recurring_days, :start_time, :offset, :last_recurring_at
end