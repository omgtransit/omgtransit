class StopTimes < ActiveRecord::Base
  attr_accessible :arrival_time, :departure_time, :source_id, :stop_id, :stop_sequence, :trip_id
end
