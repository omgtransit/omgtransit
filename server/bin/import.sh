#!/usr/bin/env bash
cd /home/app/rails-api
bundle exec rake "omgtransit:load_gtfs[MSP, STOPS]"
