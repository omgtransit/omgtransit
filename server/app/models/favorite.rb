class Favorite < ActiveRecord::Base
  attr_accessible :stop_id, :user_id

  belongs_to :user
  belongs_to :stop, :foreign_key => :stop_id
end