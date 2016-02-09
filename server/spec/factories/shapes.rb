# Read about factories at https://github.com/thoughtbot/factory_girl

FactoryGirl.define do
  factory :shape do
    source_id 1
    shape_id 1
    shape_pt_lat 1.5
    shape_pt_lon 1.5
    shape_pt_sequence 1
  end
end
