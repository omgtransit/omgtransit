class CreateFilters < ActiveRecord::Migration
  def change
    create_table :filters do |t|
      t.integer :user_id
      t.string :filter_types

      t.timestamps
    end
  end
end
