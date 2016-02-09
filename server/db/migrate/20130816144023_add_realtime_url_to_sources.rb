class AddRealtimeUrlToSources < ActiveRecord::Migration
  def change
    add_column :sources, :realtime_url, :string
  end
end
