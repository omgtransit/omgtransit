# Read about factories at https://github.com/thoughtbot/factory_girl

FactoryGirl.define do
  factory :filter do
    user_id 1
    filter_types "MyString"
  end
end
