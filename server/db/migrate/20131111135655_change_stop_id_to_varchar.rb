class ChangeStopIdToVarchar < ActiveRecord::Migration
  def up
    change_column :stops, :stop_id, :string
  end

  def down
    change_column :stops, :stop_id, :integer
  end
end
