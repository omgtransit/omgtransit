require 'faker'

FactoryGirl.define do
  factory :favorite do |f|
    sequence(:id) { |n| n }
    
    f.association :user
    f.association :stop
  end
end