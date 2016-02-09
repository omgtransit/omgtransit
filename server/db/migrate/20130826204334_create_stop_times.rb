class CreateStopTimes < ActiveRecord::Migration
  def up
    create_table :stop_times, id: false do |t|
      t.integer :source_id
      t.string :trip_id
      t.string :arrival_time
      t.string :departure_time
      t.string :stop_id
      t.integer :stop_sequence
    end
    execute "ALTER TABLE stop_times ADD PRIMARY KEY (source_id, trip_id, stop_id, stop_sequence);"
  end

  def down
    drop_table :stop_times
  end
end