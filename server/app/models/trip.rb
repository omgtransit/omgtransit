class Trip < ActiveRecord::Base
  attr_accessible :id, :block_id, :route_id, :service_id, :shape_id, :source_id, :trip_headsign, :trip_id, :wheelchair_accessible, :direction_id

  def self.get_trips_by_route(route_id)
    select('trip_id')
    .where("service_id in (
              SELECT service_id FROM calendars
              WHERE CURRENT_TIMESTAMP >= calendars.start_date
              AND CURRENT_TIMESTAMP <= calendars.end_date 
              AND #{Date.today.strftime("%A").downcase} = '1'
            )
            and route_id like '#{route_id}%'
          ")
  end
end
