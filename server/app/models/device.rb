class Device < ActiveRecord::Base
  attr_accessible :enabled, :platform, :token, :user_id

  belongs_to :user
  validates_uniqueness_of :token, :scope => :user_id
end
