class AddCar2GoToUsers < ActiveRecord::Migration
  def change
    add_column :users, :car2go_token,   :string
    add_column :users, :car2go_secret,  :string
    add_column :users, :car2go_account, :string
  end
end