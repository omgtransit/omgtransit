# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the rake db:seed (or created alongside the db with db:setup).
#
# Examples:
#
#   cities = City.create([{ name: 'Chicago' }, { name: 'Copenhagen' }])
#   Mayor.create(name: 'Emanuel', city: cities.first)

Source.delete_all()

#Read the master transit definition file
defsfile = File.open('/data/transit_defs.json',"rb")
contents = defsfile.read
contents = JSON.parse(contents)

#Convert transit types to IDs
contents["transit_systems"].each do |i|
  i["transit_type"] = contents["transit_types"][i["transit_type"]]["id"]
end

contents["transit_systems"].each do |source|
  Source.find_or_create_by_name(
    id:           source["id"], 
    name:         source["name"],
    stopdata:     source["stopdata"],
    stopparser:   source["stopparser"],
    transit_type: source["transit_type"]
  )
end