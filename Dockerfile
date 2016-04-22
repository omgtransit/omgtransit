FROM phusion/passenger-ruby19:0.9.18

# Install/Update Base System Libraryes
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update -qq && \
    apt-get upgrade -y && \
    apt-get install -y build-essential curl libpq-dev && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*
RUN npm install -g grunt grunt-cli
RUN npm install grunt-usemin grunt-preprocess grunt-filerev grunt-contrib-cssmin grunt-contrib-uglify grunt-contrib-concat grunt-contrib-clean

# Setup Folders
ENV APP_HOME /usr/app
ENV SERVER_HOME $APP_HOME/server
ENV API_HOME $APP_HOME/api
ENV ASSETS_HOME $APP_HOME/frontend
RUN mkdir -p $SERVER_HOME
RUN mkdir -p $API_HOME

# bundle install
WORKDIR /tmp
ADD server/Gemfile Gemfile
ADD server/Gemfile.lock Gemfile.lock
RUN bundle install

# mounts
# TODO mount these later if possible
ADD server/ $SERVER_HOME
ADD frontend/ $ASSETS_HOME

# generate build.js
WORKDIR $ASSETS_HOME
RUN npm install
RUN grunt -v buildweb

WORKDIR $SERVER_HOME
