class RenameDataParserColumnToStopParser < ActiveRecord::Migration
  def change
    rename_column :sources, :dataparser, :stopparser
  end
end
