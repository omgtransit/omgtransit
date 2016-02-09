class CreateAlerts < ActiveRecord::Migration
  def change
    create_table :alerts do |t|
      t.integer :user_id
      t.string :device_token
      t.float :alert_time #Floating point number from 0 to 24
      t.string :realtime_url
      t.string :route
      t.string :stop_id
      t.string :platform
      t.boolean :recurring

      t.timestamps
    end
  end
end
