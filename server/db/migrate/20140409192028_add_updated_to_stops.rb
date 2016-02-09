class AddUpdatedToStops < ActiveRecord::Migration
  def change
    add_column :stops, :updated, :bigint
  end
end
