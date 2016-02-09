class ExpandSources < ActiveRecord::Migration
  def change
    add_column :sources, :stopdata,     :string
    add_column :sources, :dataparser,   :string
    add_column :sources, :last_update,  :timestamp
    add_column :sources, :transit_type, :integer
  end
end