FROM phusion/passenger-ruby19:0.9.18

# Install/Update Base System Libraryes
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update -qq && \
    apt-get upgrade -y && \
    apt-get install -y build-essential curl wget unzip libpq-dev && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*
RUN npm install -g grunt grunt-cli

# Setup Folders
ENV APP_HOME /usr/app
ENV SERVER_HOME $APP_HOME/server
ENV API_HOME $APP_HOME/api
ENV ASSETS_HOME $APP_HOME/frontend
RUN mkdir -p $SERVER_HOME
RUN mkdir -p $API_HOME

# npm install
ADD frontend/ $ASSETS_HOME
WORKDIR $ASSETS_HOME
RUN npm install

# bundle install
WORKDIR /tmp
ADD server/Gemfile Gemfile
ADD server/Gemfile.lock Gemfile.lock
RUN bundle install

WORKDIR $SERVER_HOME