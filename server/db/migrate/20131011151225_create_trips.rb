class CreateTrips < ActiveRecord::Migration
  def up
    create_table :trips, id: false do |t|
      t.string :id #source_id, route_id, service_id, trip_id
      t.integer :source_id
      t.string :route_id
      t.string :service_id
      t.string :trip_id
      t.string :trip_headsign
      t.integer :block_id
      t.integer :shape_id
      t.integer :direction_id
      t.integer :wheelchair_accessible

      t.timestamps
    end
    execute "ALTER TABLE trips ADD PRIMARY KEY (id);"
  end

  def down
    drop_table :trips
  end
end
