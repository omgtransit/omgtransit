Server Setup
==============================

Installation
* `docker-compose build`
* initialize db
  *  `docker-compose run --rm railsweb bundle exec rake db:create db:migrate db:mongoid:create_indexes db:seed`
* `docker-compose up`

Installation
------------
 1. Download and install [ElasticSearch](http://www.elasticsearch.org/)
 2. Install Ruby 1.9.3
 3. Install Rails
   * Be sure that Rails is not trying to use Ruby 1.8, it will not work
 4. Install postgresql
 5. Install PostGIS (`sudo apt-get install postgresql-9.1-postgis`)
 6. Install Bundle
 7. Install Redis (`sudo apt-get install redis-server`)
 8. Run `bundle`
   * May need `sudo apt-get install libpq-dev`

One liner on debian...

```
sudo apt-get install elasticsearch postgresql postgis nodejs redis-server mongodb-org libpq-dev && bundle install
```

... except for install Ruby. For that:

```
rvm install <the version reported above>
```

Database Setup
--------------

 1. Create a PostGRES database
   1. `sudo -u postgres psql`
   2. `CREATE USER user WITH PASSWORD 'password';`
   3. `CREATE DATABASE omgtransit;`
   4. `GRANT ALL PRIVILEGES ON DATABASE omgtransit TO user;`
 2. Load the PostGIS extension
   1. `sudo -u postgres psql -d omgtranst`
   2. `CREATE EXTENSION postgis;`
 3. Run `sudo mkdir -p /etc/nubic/db`
 4. Create the file `/etc/nubic/db/omgtransit.yml`
 5. Set up `/etc/nubic/db/omgtransit.yml` according to **Setting up Database Credentials**

GTFS Data Acquisition
---------------------
We get the location of stops and route paths from General Transit Feed
Specification (GTFS) files. More information on these files is available
[here](https://developers.google.com/transit/gtfs/).

GTFS data is available at the [GTFS Exchange](http://www.gtfs-data-exchange.com/).

Download these data files and put them in appropriately named folders in `/etc/omgtransit/setup/`.

For instance, you can download the Minneapolis Metro Transit feed from
[here](ftp://gisftp.metc.state.mn.us/google_transit.zip). And unzip this into
the folder `/etc/omgtransit/setup/msp_gtfs`.

Mongoid Setup
==============================
1. Bundle
2. run `rake db:mongoid:create_indexes`


Loading the Database
--------------------
 1. Run `rake db:migrate`
 2. Run `rake db:seed`
 3. Run `rake omgtransit:load_gtfs[MSP, STOPS]` (Or what have you, this draws from the `setup/` folders).
  * Run `rake omgtransit:load_mn_bikes`
  * Run `rake omgtransit:load_umn_stops`
 4. Repeat Step 3 as needed

Start the Server
----------------
 1. Run `rails s` in the project's base directory to start the server

Setting Up Database Credentials
===============================
Database credentials are not part of the distribution for obvious
reasons.  The included `config/database.yml` uses the `bcdatabase`
package to retrieve the credentials from elsewhere on your Rails
server. The credentials are store in `/etc/nubic/db/omgtransit.yml`.

This file may look something like the following.

<pre>
defaults:
  adapter: postgresql
  encoding: utf8
  host: localhost
development:
  database: omgtransit-dev
  username: yourdevusername
  password: yourdevpassword
test:
  database: omgtransit-test
  username: yourtestusername
  password: yourtestpassword
prod:
  database: omgtransit
  username: yourprodusername
  password: yourprodpassword
</pre>

You should secure `omgtransit.yml` so that it can only be read by the server.
You can optionally encrypt the file as well.  For more information, see
the [bcdatabase project](https://github.com/NUBIC/bcdatabase).

Database Stops Table
==============================
<pre>
       Column        |          Type          | Modifiers
---------------------+------------------------+-----------
 stop_id             | character varying(500) | not null
 stop_code           | character varying(500) |
 stop_name           | character varying(500) | not null
 stop_desc           | character varying(500) |
 stop_lat            | numeric(9,6)           | not null
 stop_lon            | numeric(9,6)           | not null
 zone_id             | character varying(100) |
 stop_url            | character varying(500) |
 location_type       | integer                |
 parent_station      | character varying(500) |
 stop_timezone       | character varying(500) |
 wheelchair_boarding | integer                |
 stop_street         | character varying(500) |
 stop_city           | character varying(500) |
 stop_region         | character varying(500) |
 stop_postcode       | character varying(50)  |
 stop_country        | character varying(100) |
Indexes:
    "stops_pkey" PRIMARY KEY, btree (stop_id)
</pre>

Example output

<pre>
 1000    |           | 50 St W & Upton Av S        | Near side E   | 44.912365 | -93.315178 |         | http://www.metrotransit.org/NexTripBadge.aspx?stopnumber=1000  |               |                |               |                   1 | 50 St W     | MINNEAPOLIS         |             |               |
 10000   |           | Carmen Av & Claude Way E #2 | Across from S | 44.857449 | -93.040977 |         | http://www.metrotransit.org/NexTripBadge.aspx?stopnumber=10000 |               |                |               |                   1 | Carmen Av   | INVER GROVE HEIGHTS |             |               |
 10001   |           | Carmen Av & 65 St E         | Far side S    | 44.855103 | -93.042496 |         | http://www.metrotransit.org/NexTripBadge.aspx?stopnumber=10001 |               |                |               |                   1 | Carmen Av   | INVER GROVE HEIGHTS |             |               |
</pre>
