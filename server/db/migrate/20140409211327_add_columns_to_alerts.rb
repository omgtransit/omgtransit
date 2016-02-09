class AddColumnsToAlerts < ActiveRecord::Migration
  def change
    add_column :alerts, :offset, :float
    add_column :alerts, :start_time, :float
    add_column :alerts, :last_recurring_at, :date
  end
end
