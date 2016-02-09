Our API
===================================================
Stop Types:

The number is the database representation of the stop whereas the text is what
is sent client-side in our API.

  1: metro_bus
  2: bikeshare_station
  3: car2go
  4: intercity_train
  5: airport
  6: zipcar
  7: metro_train
  8: bikeshare_free



Stop Locations
--------------
    {
      id:            OMG Transit unique ID for the stop
      stop_id:       System-specific ID of the stop
      source_id:     System-id containing the stop
      stop_name:     Name of the stop
      stop_city:     City of the stop
      stop_street:   Street address of the stop
      stop_region:   Region of the stop (i.e. state or province)
      stop_postcode: Postcode of the stop (i.e. zip code)
      location:      {lat:XX.XXX, lon:XX.XXX}
      stop_type:     Type of the stop. Valid values are: bus, niceride, car2go, zipcar, train
      stop_url:      Real-time url for the stop
      updated:       Unix epoch denoting when this stop info was last updated
      distance:      Distance in miles to the stop (provided by ElasticSearch in API calls)
    }

Real-time Data
--------------
###Type 'bus'

Real-time data will also be sorted such that events are listed in ascending
order.

On failure, "false" is returned.

Returns an array of objects of the following format:

    {
      time:           Unix epoch time in seconds of the departure/arrival
      direction:      Valid values are: north, south, east, west, loop, outbound, inbound, outinbound
      route:          This is, e.g. "6E, 16B"
      description:    Description of the route, e.g. "University / Downtown"
      actual:         True if this is a real-time estimated arrival, false if it is scheduled
      departure:      True if this is an estimated departure time
      updated:        Unix epoch time in seconds of when this information was last updated by the transit agency
    });

###Type 'bike'

Returns a single object of the following format:

    {
      bikes:          Number of free bikes at the station
      docksFree:      Number of free docks at the station
      docksTotal:     Total number of docks at the station
      tris:           Number of free tricycles at the station
      open:           True if this station is open for use
      updated:        Unix epoch time in seconds of when this information was last updated by the transit agency
    });

###Type 'car2go'

Returns a single object of the following format:

    {
      vin:        Vehicle identification number
      fuel:       Percentage remaining fuel
      interior:   'GOOD' or 'BAD'
      exterior:   'GOOD' or 'BAD'
      engineType: 'CE' (combustable engine) or ??? TODO
    }

###Type 'ZipCar' returns an array of:
    {
      hourlyCost:   Hourly cost, numeric
      dailyCost:    Hourly cost, numeric
      hourlyCostFm: Hourly cost, for human display
      dailyCostFm:  Hourly cost, for human display
      description:  A name for the vehicle
      vehicleId:    Vehicle ID number
      modelId:      Model ID number of the ZipCar
      seatbelts:    Number of seat belts
      brand:        Brand, e.g. Toyota, Ford, BMW
      make:         Make, e.g. A3s, Nissan, Golf, Jetta
      type:         Type, e.g. Sedan, Hybrid, Hatchback
      capacity:     Description of how much stuff the car can hold
    }

###Type 'train' returns an array of:
    {
      time:           Unix epoch time in seconds of the departure/arrival
      direction:      Valid values are: north, south, east, west, loop, outbound, inbound, outinbound, northeast, northwest, southeast, southwest
      route:          This is, e.g. "6E, 16B"
      description:    Description of the route, e.g. "University / Downtown"
      actual:         True if this is a real-time estimated arrival, false if it is scheduled
      departure:      True if this is an estimated departure time
      updated:        Unix epoch time in seconds of when this information was last updated by the transit agency
    }

###Type 'metrotrain' returns an array of:

    {
      time:           Unix epoch time in seconds of the departure/arrival
      direction:      Valid values are: north, south, east, west, loop, outbound, inbound, outinbound
      route:          This is, e.g. "6E, 16B"
      description:    Description of the route, e.g. "University / Downtown"
      actual:         True if this is a real-time estimated arrival, false if it is scheduled
      departure:      True if this is an estimated departure time
      updated:        Unix epoch time in seconds of when this information was last updated by the transit agency
      platform:       Which platform the train departs from (false if no platform is indicated)
    }

Minneapolis/St. Paul MetroTransit API Documentation
===================================================

There are two ways to get real-time arrival data. One can use either the global numeric **StopID** via `http://svc.metrotransit.org/NexTrip/{STOPID}` or the route's local alphanumeric **StopID** via `http://svc.metrotransit.org/NexTrip/{ROUTE}/{DIRECTION}/{STOP}`.

Real-time Arrival Data for a Stop
---------------------------------

http://svc.metrotransit.org/NexTrip/{STOPID}

**StopID** is a numeric identifier available from the GTFS information in **data/stops.txt**

Example call:

    http://svc.metrotransit.org/NexTrip/17976?format=json

Example output:

    [
        {
            "DepartureTime": "/Date(1370107440000-0500)/",
            "DepartureText": "Due",
            "Description": "24St-Uptown / Lake-France",
            "VehicleLongitude": -93.26514,
            "RouteDirection": "WESTBOUND",
            "Route": "17",
            "BlockNumber": 1180,
            "Terminal": "B",
            "Actual": true,
            "Gate": "",
            "VehicleLatitude": 44.9810355,
            "VehicleHeading": 0
        },
        {
          ....
          ....
        },
        ....
    ]

List of Routes Names, Descriptions, and Providers
-------------------------------------------------
http://svc.metrotransit.org/NexTrip/Routes

Example call:

    http://svc.metrotransit.org/NexTrip/Routes?format=json

Example output:

    [
        {
            "Route": "2",
            "ProviderID": "8",
            "Description": "2 - Franklin Av - Riverside Av - U of M - 8th St SE"
        },
        {
            "Route": "3",
            "ProviderID": "8",
            "Description": "3 - U of M - Como Av - Energy Park Dr - Maryland Av"
        },
        {
            "Route": "4",
            "ProviderID": "8",
            "Description": "4 - New Brighton - Johnson St - Bryant Av - Southtown"
        }
    ]

List of Directions for a Route
------------------------------
http://svc.metrotransit.org/NexTrip/Directions/{ROUTE}

Example call:

    http://svc.metrotransit.org/NexTrip/Directions/16?format=json

Example output:

    [
        {
            "Text": "EASTBOUND",
            "Value": "2"
        },
        {
            "Text": "WESTBOUND",
            "Value": "3"
        }
    ]

List of Providers
-----------------

http://svc.metrotransit.org/NexTrip/Providers

Example call:

    http://svc.metrotransit.org/NexTrip/Providers?format=json

Example output:

    [
        {
            "Text": "University of Minnesota",
            "Value": "1"
        },
        {
            "Text": "Airport (MAC)",
            "Value": "2"
        },
        {
            "Text": "Other",
            "Value": "3"
        },
        {
            "Text": "Prior Lake",
            "Value": "4"
        },
        {
            "Text": "Scott County",
            "Value": "5"
        }
    ]

List of Stops on a Route
------------------------

http://svc.metrotransit.org/NexTrip/Stops/{ROUTE}/{DIRECTION}

Example call (East bound stops):

    http://svc.metrotransit.org/NexTrip/Stops/16/2?format=json

Example output:

    [
        {
            "Text": "Ramp B/5th St  Transit Center",
            "Value": "5GAR"
        },
        {
            "Text": "4th St S  and Nicollet Mall",
            "Value": "4NIC"
        },
        {
            "Text": "Anderson Hall (U of M)",
            "Value": "ANHA"
        },
        {
            "Text": "Jones Hall and Eddy Hall (U of M)",
            "Value": "JOED"
        },
        {
            "Text": "University Ave and Ontario St",
            "Value": "OAUN"
        }
    ]

Information About A Stop
-------------------------

http://svc.metrotransit.org/NexTrip/{ROUTE}/{DIRECTION}/{STOP}

Example call (East bound stops):

    http://svc.metrotransit.org/NexTrip/16/2/ANHA

Example output:

    [
        {
            "DepartureTime": "/Date(1370109060000-0500)/",
            "DepartureText": "Due",
            "Description": "Univ Av / St Paul",
            "VehicleLongitude": -93.249402,
            "RouteDirection": "EASTBOUND",
            "Route": "16",
            "BlockNumber": 1172,
            "Terminal": "",
            "Actual": true,
            "Gate": "",
            "VehicleLatitude": 44.9717209,
            "VehicleHeading": 0
        },
        {
            "DepartureTime": "/Date(1370109420000-0500)/",
            "DepartureText": "7 Min",
            "Description": "Univ Av / St Paul",
            "VehicleLongitude": -93.2716287,
            "RouteDirection": "EASTBOUND",
            "Route": "16",
            "BlockNumber": 1168,
            "Terminal": "",
            "Actual": true,
            "Gate": "",
            "VehicleLatitude": 44.9804872,
            "VehicleHeading": 0
        },
        {
            "DepartureTime": "/Date(1370109960000-0500)/",
            "DepartureText": "16 Min",
            "Description": "Univ Av / St Paul",
            "VehicleLongitude": -93.271077,
            "RouteDirection": "EASTBOUND",
            "Route": "16",
            "BlockNumber": 1165,
            "Terminal": "",
            "Actual": true,
            "Gate": "",
            "VehicleLatitude": 44.9806579,
            "VehicleHeading": 0
        },
        {
            "DepartureTime": "/Date(1370110560000-0500)/",
            "DepartureText": "1:16",
            "Description": "Univ Av / St Paul",
            "VehicleLongitude": 0,
            "RouteDirection": "EASTBOUND",
            "Route": "16",
            "BlockNumber": 1169,
            "Terminal": "",
            "Actual": false,
            "Gate": "",
            "VehicleLatitude": 0,
            "VehicleHeading": 0
        },
        {
            "DepartureTime": "/Date(1370111160000-0500)/",
            "DepartureText": "1:26",
            "Description": "Univ Av / St Paul",
            "VehicleLongitude": 0,
            "RouteDirection": "EASTBOUND",
            "Route": "16",
            "BlockNumber": 1164,
            "Terminal": "",
            "Actual": false,
            "Gate": "",
            "VehicleLatitude": 0,
            "VehicleHeading": 0
        }
    ]

University of Minnesota Campus Connector API Documentation
==========================================================

Download full documentation from [here](http://www.nextbus.com/xmlFeedDocs/NextBusXMLFeed.pdf).

Get Agency ID
-------------
First, we need to get the UMN **AgencyID**

    http://webservices.nextbus.com/service/publicXMLFeed?command=agencyList

The response _includes_:

    <agency tag="umn-twin" title="University of Minnesota" regionTitle="Minnesota"/>

Get A List of Routes
--------------------

Syntax:

    http://webservices.nextbus.com/service/publicXMLFeed?command=routeList&a=<AGENCYID>

Example:

    http://webservices.nextbus.com/service/publicXMLFeed?command=routeList&a=umn-twin

The response is:

    <body copyright="All data copyright University of Minnesota 2013.">
    <route tag="bdda" title="BDD Shuttle A"/>
    <route tag="bddb" title="BDD Shuttle B"/>
    <route tag="connector" title="Campus Connector"/>
    <route tag="eastbank" title="East Bank Circulator" shortTitle="East Bank"/>
    <route tag="stpaul" title="St Paul Circulator" shortTitle="St Paul"/>
    </body>

**tag** is a unique identifier for the route

Get Information About A Route
-----------------------------

Syntax:

    http://webservices.nextbus.com/service/publicXMLFeed?command=routeConfig&a=<agency_tag>&r=<route tag>

Example:

    http://webservices.nextbus.com/service/publicXMLFeed?command=routeConfig&a=umn-twin&r=connector

Response:

    <route tag="connector" title="Campus Connector" color="ff0000" oppositeColor="ffffff" latMin="44.9723784" latMax="44.9845009" lonMin="-93.2457576" lonMax="-93.1788092">
    <stop tag="willey" title="Willey Hall (West Bank)" lat="44.9723784" lon="-93.2446454" stopId="31"/>
    <stop tag="19th2nd" title="19th Avenue S & 2nd Street SE (West Bank)" shortTitle="19th S & 2nd SE (West Bank)" lat="44.9740532" lon="-93.2457576" stopId="34"/>
    <stop tag="sanford" title="Sanford Hall on University Avenue (East Bank)" shortTitle="Sanford Hall on University (East Bank)" lat="44.9808569" lon="-93.2400328" stopId="37"/>
    <stop tag="univplea" title="University Avenue & Pleasant Street SE (East Bank)" shortTitle="University & Pleasant SE (East Bank)" lat="44.979032" lon="-93.2354359" stopId="40"/>
    <stop tag="univrecc" title="University Avenue at Rec Center" shortTitle="University @ Rec Center" lat="44.9765626" lon="-93.2293284" stopId="43"/>
    <stop tag="stad23rd" title="TCF Bank Stadium & 23rd Avenue SE (East Bank)" shortTitle="TCF Bank Stadium & 23rd SE (East Bank)" lat="44.9767171" lon="-93.221742" stopId="46"/>
    <stop tag="trancomm_e" title="Transitway at Commonwealth Avenue (St. Paul)" shortTitle="Transitway @ Commonwealth (St. Paul)" lat="44.9805228" lon="-93.1807474" stopId="49"/>
    <stop tag="fairgrou_e" title="State Fairgrounds Lot S108 (St. Paul)" lat="44.9832407" lon="-93.1788092" stopId="52"/>
    <stop tag="bufogort_n" title="Buford & Gortner Avenues (St. Paul)" lat="44.98447" lon="-93.1817856" stopId="55"/>
    <stop tag="studcent" title="St. Paul Student Center" lat="44.9845009" lon="-93.1868539" stopId="10"/>
    <stop tag="bufogort_s" title="Buford & Gortner Avenues (St. Paul)" lat="44.984398" lon="-93.1816392" stopId="13"/>
    <stop tag="fairgrou_w" title="State Fairgrounds Lot S108 (St. Paul)" lat="44.9833134" lon="-93.1790258" stopId="16"/>
    <stop tag="trancomm_w" title="Transitway & Commonwealth" lat="44.9805495" lon="-93.1809199" stopId="19"/>
    <stop tag="thom23rd" title="Thompson Center & 23rd Avenue SE" shortTitle="Thompson Center & 23rd SE" lat="44.9766625" lon="-93.2216215" stopId="22"/>
    <stop tag="4thridd" title="4th Street SE in front of Ridder Arena" shortTitle="4th SE in front of Ridder Arena" lat="44.9780516" lon="-93.2296036" stopId="25"/>
    <stop tag="pleajone_w" title="Pleasant Street at Jones-Eddy Circle (East Bank)" shortTitle="Pleasant @ Jones-Eddy Circle (East Bank)" lat="44.9781822" lon="-93.2360427" stopId="28"/>
    <direction tag="west" title="Westbound" name="" useForUI="true">
      <stop tag="studcent"/>
      <stop tag="bufogort_s"/>
      <stop tag="fairgrou_w"/>
      <stop tag="trancomm_w"/>
      <stop tag="thom23rd"/>
      <stop tag="4thridd"/>
      <stop tag="pleajone_w"/>
    </direction>
    <direction tag="east" title="Eastbound" name="" useForUI="true">
      <stop tag="willey"/>
      <stop tag="19th2nd"/>
      <stop tag="sanford"/>
      <stop tag="univplea"/>
      <stop tag="univrecc"/>
      <stop tag="stad23rd"/>
      <stop tag="trancomm_e"/>
      <stop tag="fairgrou_e"/>
      <stop tag="bufogort_n"/>
    </direction>

The response shows the route's unique id, name, suggests a colour for the route, and provides the bounding lat/long box for the route.

    <route tag="connector" title="Campus Connector" color="ff0000" oppositeColor="ffffff" latMin="44.9723784" latMax="44.9845009" lonMin="-93.2457576" lonMax="-93.1788092">

A number of stops on the route are specified, along with their unique tag.

    <stop tag="studcent" title="St. Paul Student Center" lat="44.9845009" lon="-93.1868539" stopId="10"/>

The direction of the bus is indicated as follows:

    <direction tag="east" title="Eastbound" name="" useForUI="true">
      <stop tag="willey"/>
      <stop tag="19th2nd"/>
      <stop tag="sanford"/>
      <stop tag="univplea"/>
      <stop tag="univrecc"/>
      <stop tag="stad23rd"/>
      <stop tag="trancomm_e"/>
      <stop tag="fairgrou_e"/>
      <stop tag="bufogort_n"/>
    </direction>

There are also a number of path tags which are essentially the shapefile of the bus's route.

The paths are simply lists of coordinates that can be used to draw a route on a map. The path
data can be voluminous. If you do not need the path data you should add “&terse” to the
routeConfig URL and the volume of returned data will be cut approximately in half. This is
especially useful for mobile apps where you want to transfer as little data as possible.

Due to the nature of the configuration there can be many separate paths, some of them
overlapping. A map client should simply draw all of the paths. The paths are not necessarily in
any kind of order so you should only connect the points within a path. You should not connect the
points between two separate paths though.

Getting Arrival Information
---------------------------

Get all buses passing through the stop:

    http://webservices.nextbus.com/service/publicXMLFeed?command=predictions&a=<agency_tag>&stopId=<stop id>

Get only buses on a particular route passing through the stop:

    http://webservices.nextbus.com/service/publicXMLFeed?command=predictions&a=<agency_tag>&stopId=<stop id>&routeTag=<route tag>

Example:

    http://webservices.nextbus.com/service/publicXMLFeed?command=predictions&a=umn-twin&stopId=10

Response:

  <body copyright="All data copyright University of Minnesota 2013.">
    <predictions agencyTitle="University of Minnesota" routeTitle="Campus Connector" routeTag="connector" stopTitle="St. Paul Student Center" stopTag="studcent">
      <direction title="Westbound">
        <prediction epochTime="1370533500000" seconds="784" minutes="13" isDeparture="true" affectedByLayover="true" dirTag="west" vehicle="3825" block="3111"/>
        <prediction epochTime="1370534400000" seconds="1684" minutes="28" isDeparture="true" affectedByLayover="true" dirTag="west" vehicle="3813" block="3113"/>
        <prediction epochTime="1370535300000" seconds="2584" minutes="43" isDeparture="true" affectedByLayover="true" dirTag="west" vehicle="3816" block="3112"/>
        <prediction epochTime="1370536200000" seconds="3484" minutes="58" isDeparture="true" affectedByLayover="true" dirTag="west" vehicle="3825" block="3111"/>
        <prediction epochTime="1370537100000" seconds="4384" minutes="73" isDeparture="true" affectedByLayover="true" dirTag="west" vehicle="3813" block="3113"/>
      </direction>
      <message text="May Session Schedule: 15 Minute Service from 7:00 AM to 6:00 PM. No Weekend Service"/>
    </predictions>
    <predictions agencyTitle="University of Minnesota" routeTitle="St Paul Circulator" routeTag="stpaul" stopTitle="St. Paul Student Center" stopTag="studcent" dirTitleBecauseNoPredictions="Loop"></predictions>
  </body>

No more than 5 predictions per direction will be provided in the feed.

The predictions are returned in both seconds and minutes. The "minute" value is what should
currently be displayed. The "seconds" value can be used to determine when the minute value will
change requiring an update. Predictions should only be displayed in minutes, rounding down the
number of seconds. The predictions are also provided in "epochTime". Epoch time is a standard,
defined as the number of seconds elapsed since midnight Coordinated Universal Time (UTC) of
January 1, 1970, not counting leap seconds. It is useful for when one needs to display the
prediction time as a time of day, such as "4:15pm".

If **isDeparture** is true, then this is the estimated time at which the bus will depart, otherwise the prediction is for when the bus will arrive.

If **isScheduleBased** is set, then the prediction is not based on real-time data.

If **delayed** is set, the vehicle is traveling slower than was expected over the past few minutes.

NiceRide API
=================================

The [NiceRide](https://secure.niceridemn.org) system rents bicycles on an
hourly basis throughout Minneapolis and St. Paul. Bikes may be rented or
returned from automated stations.

The NiceRide API can be used to get the location of these stations, as well as
the number of bikes available.

The API takes the form a single XML file available at
https://secure.niceridemn.org/data2/bikeStations.xml

The following is the start of this file:

    <stations lastUpdate="1375231472074" version="2.0">
      <station>
      <id>2</id>
      <name>100 Main Street SE</name>
      <terminalName>30000</terminalName>
      <lastCommWithServer>1375231456412</lastCommWithServer>
      <lat>44.984892</lat>
      <long>-93.256551</long>
      <installed>true</installed>
      <locked>false</locked>
      <installDate/>
      <removalDate/>
      <temporary>false</temporary>
      <public>true</public>
      <nbBikes>17</nbBikes>
      <nbEmptyDocks>10</nbEmptyDocks>
      <latestUpdateTime>1375230969269</latestUpdateTime>
      </station>

Washington DC Bike Share API
==========================================================
The [Capitol Bike Share](http://www.capitalbikeshare.com/) system rents
bicycles on an hourly basis in the DC area. Bikes may be rented or returned
from automated stations.

The NiceRide API can be used to get the location of these stations, as well as
the number of bikes available.

The API takes the form a single XML file available at
http://www.capitalbikeshare.com/data/stations/bikeStations.xml

The following is the start of the file:
    <stations lastUpdate="1378089568987" version="2.0">
      <station>
      <id>1</id>
      <name>20th & Bell St</name>
      <terminalName>31000</terminalName>
      <lastCommWithServer>1378089538797</lastCommWithServer>
      <lat>38.8561</lat>
      <long>-77.0512</long>
      <installed>true</installed>
      <locked>false</locked>
      <installDate>1316059200000</installDate>
      <removalDate/>
      <temporary>false</temporary>
      <public>true</public>
      <nbBikes>1</nbBikes>
      <nbEmptyDocks>9</nbEmptyDocks>
      <latestUpdateTime>1378088198251</latestUpdateTime>
      </station>

RouteShout API
====================================
The RouteShout API is documented [here](http://www.routeshout.com/main/api).

**An API key is required.**

The API covers the following transit agencies (as of 2013-09-06):

Berkshire Regional Transit Authority, Massachusetts; Braswell Transportation, Testing; Breckenridge Free Ride, Colorado; CATS TRAX, Louisiana; Central Ohio Transit Authority, Ohio; City of Dekalb - DSATS Voluntary Action, Illinois; Columbia Transit, Missouri; Cottonwood Area Transit, Arizona; DuFAST Transit, Pennsylvania; Fairbanks North Star Borough, Alaska; Fort Wayne Citilink, Indiana; Franklin Regional Transit Authority, Massachusetts; GoHART, Florida; Grand Forks City Bus, North Dakota; Greater Lynchburg Transit Company, Virginia; Greeley Evans Transit, Colorado; Indiana County Transit Authority, Pennsylvania; Island Transit, Washington; JAC - Jump Around Carson, Nevada; Lake Transit Authority, California; Metropolitan Atlanta Rapid Transit Authority, Testing; Minnesota Valley Transit Authority, Minnesota; Monroe County Transit Authority, Pennsylvania; Mountain Line, Arizona; Nashua Transit System, New Hampshire; Owensboro Transit System, Kentucky; Port Authority of Allegheny County, Pennsylvania; Porterville Transit, California; The JO, Kansas; Tyler Transit, Texas; University Of Georgia, Georgia

Getting Agency List
------------------------------
Use

    http://api.routeshout.com/v1/rs.agencies.getList?key=APIKEY

Example output:

    {
        "status": "ok",
        "response": [
            {
                "state": "Massachusetts",
                "title": "Berkshire Regional Transit Authority",
                "timezone": "America/New_York",
                "id": "brta"
            },
            {
                "state": "Testing",
                "title": "Braswell Transportation",
                "timezone": "America/New_York",
                "id": "braswell"
            },
            {
                "state": "Colorado",
                "title": "Breckenridge Free Ride",
                "timezone": "America/Denver",
                "id": "bfr"
            },

Get Route List for Agency
-----------------------------

Use:

    http://api.routeshout.com/v1/rs.routes.getList?key=APIKEY&agency=nd_cat

Example Output:

    {
        "status": "ok",
        "response": [
            {
                "type": 3,
                "short_name": "CAT Night Service",
                "long_name": "CAT Night Service",
                "id": "CAT Night Service"
            },
            {
                "type": 3,
                "short_name": "Route 10 - Black",
                "long_name": "Route 10 - Black",
                "id": "Route 10 - Black"
            },
            {
                "type": 3,
                "short_name": "Route 11 - Black",
                "long_name": "Route 11 - Black",
                "id": "Route 11 - Black"
            },

Get All Stops for an Agency
---------------------------

Use:

    http://api.routeshout.com/v1/rs.stops.getList?key=APIKEY&agency=nd_cat

Example Output:

    {
        "status": "ok",
        "response": [
            {
                "lon": -97.0398254557124,
                "code": "10th St & 36th Ave S",
                "name": "10th St & 36th Ave S",
                "lat": 47.8858791461008,
                "id": "10th St & 36th Ave S"
            },
            {
                "lon": -97.0358552441472,
                "code": "110 Cherry St",
                "name": "110 Cherry St",
                "lat": 47.919983826087,
                "id": "110 Cherry St"
            },
            {
                "lon": -97.0481313723075,
                "code": "13th Ave & 15th St",
                "name": "13th Ave & 15th St",
                "lat": 47.9091480312086,
                "id": "13th Ave & 15th St"
            },

**Get stops for a route:**

Use:

    http://api.routeshout.com/v1/rs.stops.getList?key=APIKEY&agency=nd_cat&route=Route 10 - Black

Example Output:

    {
        "status": "ok",
        "response": [
            {
                "lon": -97.0365280640796,
                "code": "17th & River Rd",
                "name": "17th & River Rd",
                "lat": 47.9418365089599,
                "id": "17th & River Rd"
            },
            {
                "lon": -97.0310398642313,
                "code": "8th Ave & 20th St NW",
                "name": "8th Ave & 20th St NW",
                "lat": 47.9449664181019,
                "id": "8th Ave & 20th St NW"
            },
            {
                "lon": -97.025913018759,
                "code": "Cabelas",
                "name": "Cabelas",
                "lat": 47.9285862670964,
                "id": "Cabelas"
            },

Also:

rs.stops.getListByTrip
rs.stops.getListByLocation
rs.stops.getInfo
rs.stops.getTimes
rs.shape.getListByTrip

Other APIs
==============================
[Massachusetts Department of Transportation](http://www.massdot.state.ma.us/DevelopersData.aspx)


Amtrak
======
Stops: http://www.gtfs-data-exchange.com/agency/amtrak/
Get list of routes: http://www.amtrak.com/rttl/js/RoutesList.json
Get route properties: http://www.amtrak.com/rttl/js/route_properties.json


AirLine
==============================
FAA ASDI: http://www.fly.faa.gov/ASDI/asdi.html

Airport statuses: http://services.faa.gov/docs/services/airport/

Example return:

    <AirportStatus>
         <!-- Airport Name -->
        <Name>San Francisco Int'l</Name>
        <!-- International Civil Aviation Organization Airport Code -->
        <ICAO>KSFO</ICAO> 
        <!-- International Association of Travel Agents Airport Code -->    
        <IATA>SFO</IATA> 
        <!-- Is there a delay? -->
        <Delay>true</Delay> 
        <!-- Status -->
        <Status> 
            <!-- Types: Airport Closure, Ground Stop, Ground Delay, Arrival and/or Departure -->
            <Type>Ground Delay</Type> 
            <!-- For use with All types -->
            <Reason>LOW CEILINGS</Reason> 
            <!-- For use with Ground Delay -->
            <AvgDelay>32 minutes</AvgDelay>  
            <!-- For use with Airport Closures -->
            <ClosureEnd/> 
            <ClosureBegin/> 
            <!-- For use with Arrival and/or Departure Delays -->
            <MinDelay/> 
            <Trend/> 
            <MaxDelay/>
            <!-- For use with Ground Stops --> 
            <EndTime/> 
        </Status>
        <!-- Weather from NOAA -->
        <Weather> 
            <Weather>Mostly Cloudy</Weather> 
            <Meta>
                <Credit>NOAA's National Weather Service</Credit>
                <Url>http://weather.gov/</Url>
                <!-- Update Time is local to airport itself -->
                <Updated>11:56 AM Local</Updated> 
            </Meta>
            <Wind>South at 9.2mph</Wind> 
            <Temp>66.0 F (18.9 C)</Temp>
            <Visibility>10.00</Visibility>
        </Weather>
    </AirportStatus>
    



ATLANTA
============================

Thank you Richard Barnes  for your request .  Our BRD Web service is provided in both REST and SOAP formats. 
MARTA Bus Real-time Data RESTful Web Service:
http://developer.itsmarta.com/BRDRestService/BRDRestService.svc/help
MARTA Bus Real-time Data SOAP Web Service:
http://developer.itsmarta.com/BRDWebService/BRDWebService.asmx

Method 1:

Method GetBRD  is used to return the Bus Real Time Data as XML by inputting a Route Number.

Example:

Input: 1

Output XML:

    <?xml version="1.0" encoding="utf-8" ?>
     <NewDataSet> 
      <Table> 
          <MSGTIME> 2012-10-22T10:26:17-07:00 </MSGTIME> 
          <DIRECTION> Northbound </DIRECTION> 
          <ROUTE> 1 </ROUTE> 
          <TIMEPOINT> Luckie St & North Ave. </TIMEPOINT> 
          <VEHICLE> 2551 </VEHICLE> 
          <LATITUDE> 337771955 </LATITUDE> 
          <LONGITUDE> -844075435 </LONGITUDE> 
          <Adherence> -2 </Adherence> 
      </Table>
      <Table> 
          <MSGTIME> 2012-10-22T10:31:06-07:00 </MSGTIME> 
          <DIRECTION> Southbound </DIRECTION> 
          <ROUTE> 1 </ROUTE> 
          <TIMEPOINT> Coronet Way & Moores Mill Road </TIMEPOINT> 
          <VEHICLE> 2978 </VEHICLE> 
          <LATITUDE> 338209075 </LATITUDE> 
          <LONGITUDE> -844507644 </LONGITUDE> 
          <Adherence> -4 </Adherence> 
      </Table>
     </NewDataSet>
    </xml>

Method 2:

Method GetBRDJSON is used to return the Bus Real Time Data as JSON by inputting a Route Number.

Example:

Input: 1

Output String :

    <?xml version="1.0" encoding="utf-8" ?>
    <string xmlns=" http://tempuri.org/ ">[["11/1/2012 3:29:32 PM","Northbound","1","Coronet Way & Moores Mill Road","2975","338211472","-844498907","0"],["11/1/2012 3:32:41 PM","Southbound","1","Luckie St & North Ave.","2979","337691695","-843921733","-3"],["11/1/2012 3:26:13 PM","Northbound","1","Alabama & Broad St.","2517","337672724","-843918601","-3"]]</string>
    </xml>
 
If you have any specific questions with the BRD web service please send an email to MartaDevReq@itsmarta.com .  Thank you for your interest.

ZipCar
======================================
End-points:

 * http://www.zipcar.com/api/drupal/1.0/vehicle-models?locale=en-US
 * http://www.zipcar.com/api/drupal/1.0/fleets/16675595/neighborhoods?locale=en-US
 * http://www.zipcar.com/api/drupal/1.0/locations?lat=44.97815010754884&lon=-93.21573420000004&lat_delta=0.3215729608338146&lon_delta=0.7456670532226563&locale=en-US
 * http://www.zipcar.com/api/drupal/1.0/vehicle-styles?locale=en-US
 * http://www.zipcar.com/api/drupal/1.0/fleets?locale=en-US
 * http://www.zipcar.com/api/drupal/1.0/markets?locale=en-US
 * http://www.zipcar.com/api/drupal/1.0/neighborhoods?locale=en-US

Chicago Clever API
=====================================
Appendix B: Station IDs
Each bus or train stop on the CTA system, as you’ll see if you look at the “stops” table in our Google Transit Feed Specification feed, has its own unique identifier. This helps to power trip planners such as the Google Maps transit directions capability in identifying individual locations and paths where vehicles make stops along a route in each direction.

Note, however, that in the GTFS data, most train stations have three entries in the stops table—one in each direction, with a third entry that covers the entire station facility, known as the “parent stop.” We’ve numbered our stops differently, using the following convention:

0-29999              = Bus stops
30000-39999          = Train stops
40000-49999          = Train stations (parent stops)

The API accepts and responds with both train stop IDs and station IDs to allow you maximum flexibility in how you build your application.

Salt Lake City API
==================
Q1 the progress rate flag indicates the following states as of the 
last chance on 3/21/12 

    0 = Early - vehicle is running early 
    1 = On Time - vehicle is running on stated to up to + 4 minutes 59 
seconds behind 
    2 = Late - vehicle is greater than 4:59 to 9:59 late 
    3 = Critical Late - vehicle is greater than 10 minutes late 
    4 = Critical Early - vehicle is greater than 10 minutes early 
    5 = Not Set - no data available 

Q2 Estimated Departure time is expressed in seconds out. so in the 
case that you quoted 438 seconds from departure. 

Using estimated departure is the easiest way to determine arrival of a 
bus. As that field indicates when the bus will leave the monitored 
stop. You can also look at distance and VehicleAtStop to see if the 
bus is close or if it is at the stop. 

Chicago Rail-Time Metra
=======================
Doesn't have a public API, but has a private one!

https://metrarail.com/content/metra/wap/en/home/RailTimeTracker/jcr:content/trainTracker.get_stations_from_line.json?trackerNumber=0&trainLineId=MD-N

http://12.205.200.243/AJAXTrainTracker.svc/GetAcquityTrainData
{"stationRequest":{"Corridor":"MD-W","Destination":"RIVERGROVE","Origin":"BIGTIMBER","timestamp":"/Date(1398791303435-0000)/"}}

Acquired GTFS from here: http://metrarail.com/content/dam/metra/documents/GoogleFeed/GTFSdata030213.zip
Through here: http://metrarail.com/metra/en/home/about_metra/obtaining_records_from_metra.html