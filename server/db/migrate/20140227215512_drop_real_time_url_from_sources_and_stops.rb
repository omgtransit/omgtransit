class DropRealTimeUrlFromSourcesAndStops < ActiveRecord::Migration
  def change
    remove_column :sources, :realtime_url
    remove_column :stops,   :url
  end
end
