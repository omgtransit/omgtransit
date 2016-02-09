class AddRecurringDaysToAlerts < ActiveRecord::Migration
  def change
    add_column :alerts, :recurring_days, :string
  end
end
