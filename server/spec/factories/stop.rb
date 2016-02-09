require 'faker'

FactoryGirl.define do
  
  factory :stop do
    sequence(:stop_id) { |n| n }
    source_id { 1 }

    id { "#{source_id}-#{stop_id}" }
    stop_name { Faker::Company.catch_phrase }
    stop_lat { Faker::Address.latitude }
    stop_lon { Faker::Address.longitude }
    url { Faker::Internet.url }
    stop_type { 1 }
  end
end