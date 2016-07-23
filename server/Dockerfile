FROM phusion/passenger-customizable:0.9.18
RUN /pd_build/utilities.sh
RUN /pd_build/ruby1.9.sh
RUN /pd_build/nodejs.sh

# Install/Update Base System Libraryes
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update -qq && \
    apt-get upgrade -y && \
    apt-get install -y build-essential curl wget unzip libpq-dev && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*
RUN npm install -g grunt grunt-cli

# Set correct environment variables.
ENV HOME /root

# Setup Folders
ENV APP_HOME /home/app
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
WORKDIR /bundle
ADD server/Gemfile Gemfile
ADD server/Gemfile.lock Gemfile.lock
RUN bundle install --system

# Start Nginx and Passenger
EXPOSE 80
RUN rm -fv /etc/service/nginx/down

# Configure Nginx
RUN rm -fv /etc/nginx/sites-enabled/default
ADD server/nginx/omg_server.conf /etc/nginx/sites-enabled/omg_server.conf

ADD . $SERVER_HOME
RUN chown -R app:app $SERVER_HOME

WORKDIR $SERVER_HOME
RUN apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

