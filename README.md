Dev Quick Start
======================
```
docker-compose build
# build frontend assets
docker-compose run railsweb bash ./bin/buildweb.sh
# setup datasources
docker-compose run railsweb bundle exec rake db:create db:migrate db:mongoid:create_indexes db:seed
# run the app on http://$(docker-machine ip):3000
docker-compose up
```


Getting Things Running
======================

1. Set up some hostnames
  * Edit `/etc/hosts` and add the lines

    127.0.0.1 omgtransit.it
    127.0.0.1 app.omgtransit.it

2. Set up apache
  * `sudo apt-get install apache2`
2. Enable SSL module
  * `sudo a2enmod ssl`
4. Set up local SSL

    openssl genrsa -des3 -out server.key 1024
    #Don't use a challenge password
    openssl req -new -key server.key -out server.csr
    cp server.key server.key.org
    openssl rsa -in server.key.org -out server.key
    openssl x509 -req -days 365 -in server.csr -signkey server.key -out server.crt
    sudo mkdir /etc/apache2/ssl
    sudo cp server.crt /etc/apache2/certs/server.crt
    sudo cp server.key /etc/apache2/certs/server.key

6. Install Passenger
  * `sudo gem install passenger`
7. Set up the Apache Passenger Module
  * `passenger-install-apache2-module`
8. Edit `/etc/apache2/sites-enabled/000-default.conf`

    <VirtualHost *:80>

        ServerName omgtransit.it
        DocumentRoot /home/rick/projects/omgtransit/omgtransit-web/server/public
        RailsEnv development

        <Directory />
           Options Indexes MultiViews FollowSymLinks
           AllowOverride All
           Require all granted
        </Directory>
    </VirtualHost>

    <VirtualHost *:443>

        ServerName omgtransit.it
        DocumentRoot /home/rick/projects/omgtransit/omgtransit-web/server/public
        RailsEnv development

        <Directory />
           Options Indexes MultiViews FollowSymLinks
           AllowOverride All
           Require all granted
        </Directory>

        SSLEngine on 
        SSLOptions +StrictRequire 
        SSLCertificateFile /etc/apache2/certs/server.crt
        SSLCertificateKeyFile /etc/apache2/certs/server.key
    </VirtualHost>

    <VirtualHost *:80>

        ServerName app.omgtransit.it
        DocumentRoot /home/rick/projects/omgtransit/omgtransit-web/frontend/www
        RailsEnv development

        <Directory />
           Options Indexes MultiViews FollowSymLinks
           AllowOverride All
           Require all granted
        </Directory>
    </VirtualHost>

    <VirtualHost *:443>

        ServerName app.omgtransit.it
        DocumentRoot /home/rick/projects/omgtransit/omgtransit-web/frontend/www
        RailsEnv development

        <Directory />
           Options Indexes MultiViews FollowSymLinks
           AllowOverride All
           Require all granted
        </Directory>

        SSLEngine on 
        SSLOptions +StrictRequire 
        SSLCertificateFile /etc/apache2/certs/server.crt
        SSLCertificateKeyFile /etc/apache2/certs/server.key
    </VirtualHost>

9. Restart Apache
  * `sudo service apache2 restart`

Running It All
==============
Switch into the **api** directory. Run:

    NODE_ENV=local node app

Load up "https://omgtransit.it" in a browser

Running on Docker
=================

1. [Install Docker Engine](https://docs.docker.com/engine/installation/)
2. [Install Docker Compose](https://docs.docker.com/compose/install/)
3. `docker-compose build`
4. `docker-compose up`
