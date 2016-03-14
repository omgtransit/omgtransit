FROM debian:jessie
RUN \
  apt-get update -qq && \
  apt-get upgrade -y && \
  apt-get install -y build-essential curl libpq-dev sudo

# Setup User and folders
RUN \
  adduser --gecos 'OMG user' --disabled-password omg && \
  echo "omg ALL = NOPASSWD: /usr/bin/apt-get" >> /etc/sudoers
USER omg
ENV USER_HOME /home/omg
ENV APP_HOME $USER_HOME/app
ENV SERVER_HOME $APP_HOME/server
ENV API_HOME $APP_HOME/api
RUN mkdir -p $SERVER_HOME 
RUN mkdir -p $API_HOME 

# Install RVM
WORKDIR $USER_HOME
RUN /bin/bash -l -c "\
  gpg --homedir $USER_HOME/.gnupg --keyserver hkp://keys.gnupg.net --recv-keys D39DC0E3 && \
  curl -sSL https://get.rvm.io | bash -s stable && \
  source $USER_HOME/.rvm/scripts/rvm && \
  rvm requirements "

# Prep Ruby/Bundler
ADD server/.ruby-version $SERVER_HOME/.ruby-version
ADD server/Gemfile $SERVER_HOME/Gemfile 
ADD server/Gemfile.lock $SERVER_HOME/Gemfile.lock

# Install the Ruby
WORKDIR $SERVER_HOME
RUN cat $SERVER_HOME/.ruby-version | rvm install
RUN gem install bundler
RUN bundle install

ADD server/ $SERVER_HOME
