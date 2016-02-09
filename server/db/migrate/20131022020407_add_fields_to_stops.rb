class AddFieldsToStops < ActiveRecord::Migration
  def up
    add_column :stops, :source_id, :integer
    add_column :stops, :stop_id, :integer
    add_column :stops, :url, :string
    
    change_column :stops, :id, :string
    execute "ALTER TABLE stops DROP CONSTRAINT IF EXISTS stops_pkey; ALTER TABLE stops ADD PRIMARY KEY (id);"
  end

  def down
    remove_column :stops, :source_id
    remove_column :stops, :url
    remove_column :stops, :stop_id
  end
end
