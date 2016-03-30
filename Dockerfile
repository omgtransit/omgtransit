FROM phusion/passenger-ruby19:0.9.18

# Install/Update Base System Libraryes
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update -qq && \
    apt-get upgrade -y && \
    apt-get install -y build-essential curl libpq-dev && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Setup Folders
ENV APP_HOME /usr/app
ENV SERVER_HOME $APP_HOME/server
ENV API_HOME $APP_HOME/api
RUN mkdir -p $SERVER_HOME
RUN mkdir -p $API_HOME

# Prep Ruby/Bundler
ADD server/.ruby-version $SERVER_HOME/.ruby-version
ADD server/Gemfile $SERVER_HOME/Gemfile
ADD server/Gemfile.lock $SERVER_HOME/Gemfile.lock

# Install the Ruby
WORKDIR $SERVER_HOME
RUN /bin/bash -l -c 'bundle install --standalone'

# Add the App
ADD server/ $SERVER_HOME
RUN echo "#!/bin/bash" > /etc/my_init.d/01_omg_server.sh
RUN echo "cd $SERVER_HOME" >> /etc/my_init.d/01_omg_server.sh
RUN echo "/bin/bash -l -c \"bundle exec rails s -p 3000\"" >>  /etc/my_init.d/01_omg_server.sh

RUN chmod +x /etc/my_init.d/01_omg_server.sh

CMD ["/sbin/my_init"]
