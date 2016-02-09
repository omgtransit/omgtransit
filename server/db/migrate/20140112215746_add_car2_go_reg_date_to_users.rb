class AddCar2GoRegDateToUsers < ActiveRecord::Migration
  def change
    add_column :users, :car2go_regdate, :datetime
  end
end
