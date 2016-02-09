# Read about factories at https://github.com/thoughtbot/factory_girl

FactoryGirl.define do
  factory :alert do
    user_id 1
    device_id 1
    alert_time "2014-02-04 15:34:22"
    realtime_url "MyString"
  end
end
