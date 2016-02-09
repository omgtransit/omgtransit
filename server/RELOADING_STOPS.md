## To reload navigate to
cd /server

Then, proceed with running the commands to reload.
If production, you will need to add `RAILS_ENV=production` to the end.

# Cites / Transit
bundle exec rake "omgtransit:load_gtfs[MSP, STOPS]"

bundle exec rake "omgtransit:load_gtfs[SEATTLE, STOPS]"
bundle exec rake "omgtransit:load_gtfs[SOUNDTRANSIT, STOPS]"

bundle exec rake "omgtransit:load_gtfs[PORTLAND, STOPS]"
bundle exec rake "omgtransit:load_gtfs[CHICAGO, STOPS]"

# Amtrak
bundle exec rake omgtransit:load_amtrak_stations

# NextBus
bundle exec rake omgtransit:reload_all_nextbus

# Bikeshares
bundle exec rake omgtransit:load_pbsbikes

# Seattle Bikeshare
bundle exec rake omgtransit:reload_pronto

# Carshares
bundle exec rake omgtransit:reload_zipcar
bundle exec rake omgtransit:reload_hourcar