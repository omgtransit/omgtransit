class AddIndexToStopTimes < ActiveRecord::Migration
  def change
    add_index(:stop_times, :trip_id)
  end
end
