class CreateRoutes < ActiveRecord::Migration
  def up
    create_table :routes, id: false do |t|
      t.string :id #source_id-route_id-agency_id
      t.integer :source_id
      t.string :route_id
      t.integer :agency_id
      t.string :route_short_name
      t.string :route_long_name
      t.string :route_desc
      t.integer :route_type
      t.string :route_url
      t.string :route_color
      t.string :route_text_color
    end
    execute "ALTER TABLE routes ADD PRIMARY KEY (id);"
  end

  def down
    drop_table :routes
  end
end
