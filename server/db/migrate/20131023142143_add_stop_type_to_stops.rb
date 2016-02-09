class AddStopTypeToStops < ActiveRecord::Migration
  def change
    add_column :stops, :stop_type, :integer
  end
end
