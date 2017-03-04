#!/usr/bin/env bash
cd /home/app/rails-api
bundle exec rake db:create db:migrate db:mongoid:create_indexes db:seed
