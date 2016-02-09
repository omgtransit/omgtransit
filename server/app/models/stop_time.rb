class StopTime < ActiveRecord::Base

  def self.get_times_by_stop_and_trip(stop_id, route_id)
    id = stop_id.split('-')
    source_id = id[0]
    stop_id = id[1]

    trips = Trip.get_trips_by_route(route_id)
    timenow = Time.new.strftime("%H:%M:00")
    trip = StopTime.select('stop_times.trip_id, stop_times.stop_sequence').where(["arrival_time >= ? and stop_id = ? and trip_id in (?)", timenow, stop_id, trips.collect(&:trip_id)]).order('arrival_time').limit(1)
    
    unless trip.blank?
      self.select("stop_times.trip_id, stop_times.source_id, stop_times.arrival_time, stop_times.stop_id, stop_times.stop_sequence, #{trip[0].stop_sequence} as current_seq, stops.stop_name, stops.stop_lat, stops.stop_lon, stops.stop_url")
      .joins("inner join stops on stops.stop_id = stop_times.stop_id")
      .where(['stop_times.trip_id = ? and stops.source_id = ? and stop_times.source_id = ?', trip[0].trip_id, source_id, source_id])
      .order('stop_times.stop_sequence')
    end
  end

end
