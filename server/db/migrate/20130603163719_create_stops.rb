class CreateStops < ActiveRecord::Migration
  def up
    create_table :stops do |t|
      t.string :stop_id, null: false
      t.string :stop_code
      t.string :stop_name, null: false
      t.string :stop_desc
      t.string :stop_lat, precision: 9, scale: 6, null: false
      t.string :stop_lon, precision: 9, scale: 6, null: false
      t.string :zone_id, limit: 100
      t.string :stop_url
      t.string :stop_timezone
      t.integer :wheelchair_boarding
      t.string :stop_street
      t.string :stop_city
      t.string :stop_region
      t.string :stop_postcode, limit: 50
      t.string :stop_country, limit: 100
    end
  end

  def down
    remove_table :stops
  end
end
