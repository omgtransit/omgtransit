class AddStopNameToAlerts < ActiveRecord::Migration
  def change
    add_column :alerts, :stop_name, :string
  end
end
