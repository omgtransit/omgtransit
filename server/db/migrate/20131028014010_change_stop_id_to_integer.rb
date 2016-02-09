class ChangeStopIdToInteger < ActiveRecord::Migration
  def up
    change_column :favorites, :stop_id, :string
  end

  def down
    change_column :favorites, :stop_id, :integer
  end
end
