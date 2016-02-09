require 'faker'

FactoryGirl.define do
  factory :user do
    sequence(:id) { |n| n }
    name { Faker::Name.first_name }
    email { Faker::Internet.email }
    password { Faker::Internet.password + '123457' }

    factory :favorite_user do
      ignore do
        favorite_count 3
      end

      after(:create) do |user, e|
        stop_list = create_list(:stop, e.favorite_count)
        e.favorite_count.times do |i|
          FactoryGirl.create(:favorite, user: user, stop: stop_list[i])
        end
      end
    end
  end
end