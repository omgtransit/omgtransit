class AlterStopsFields < ActiveRecord::Migration
  def up
    remove_column :stops, :stop_id
  end

  def down
    add_column :stops, :stop_id, :string
  end
end