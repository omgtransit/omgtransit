var request      = require('request');
var moment       = require('moment');
var redis        = require("redis");
var redisclient  = redis.createClient();
var _            = require('lodash');
var transit_defs = require('../lib/transit_defs');
var utility      = require('../lib/utility');
var Q            = require('q');
var config       = require('../config');
var Db           = require('mongodb').Db;
var xml2js       = require('xml2js').parseString;
var mongoClient;
require('log-timestamp');
require('dotenv').config();

Db.connect(process.env.mongo_host, function(err, db) {
  if(err) {
    console.log("Error Starting up Mongo!@");
    console.log(err);
    return;
  }
  console.log('Starting up mongo.');
  mongoClient = db;

});


function update_mongo_index(stop_type, stops_to_index){
  var cursor = mongoClient.collection('mongo_stops').find({stop_type:stop_type},{stop_id:1});

  //Create a hash table of all of the stops we plan to index
  var stops_to_potentially_insert = {};
  _.each(stops_to_index, function(stop){
    stops_to_potentially_insert[stop.stop_id]=stop;
  });

  cursor.toArray(function(err, stops_in_index){
    var stops_to_remove = [];
    _.each(stops_in_index, function(stop){
      //console.log(JSON.stringify(stop));
      //Stop isn't present in the insert list, so we add it to the list of stops
      //we plan to delete
      if(typeof(stops_to_potentially_insert[stop.stop_id])==="undefined")
        stops_to_remove.push(stop.stop_id);
      else //Stop is present on the insert list, so we don't want to insert it twice
        delete stops_to_potentially_insert[stop.stop_id];
    });

    var stops_to_insert=[];
    for(var i in stops_to_potentially_insert)
      stops_to_insert.push(stops_to_potentially_insert[i]);

    var current_time = moment().unix();

    //console.log(JSON.stringify(stops_to_insert));

    mongoClient.collection('mongo_stops').insert(stops_to_insert, {w:'majority'}, function(err, docs){
      if(err) console.error('Index update error', err);
      mongoClient.collection('mongo_stops').remove({stop_type:stop_type, stop_id: {$in: stops_to_remove}}, function(err, docs){
        if(err) console.error('Index update error', err);
        mongoClient.collection('mongo_stops').update({stop_type:stop_type}, {$set: {updated:current_time}}, {multi:true}, function(err, docs){
          if(err)
            console.error('Index update error', err);
          else
            console.error('Index update success.');
        });
      });
    });

    


  });
}



//-------------------------------------------------
//DEFINE UPDATERS
//-------------------------------------------------

//Updaters have the following properties:
// onStart:   If this is true, the updater will run as soon as the server starts
// frequency: The number of seconds between updates.
// update:    A function to be run when the update triggers

var updaters = {
  amtrak: {
    onStart:   true,
    frequency: 10*60,
    update: function(){
      console.log('Updater: Amtrak started.');

      var url="https://www.googleapis.com/mapsengine/v1/tables/01382379791355219452-08584582962951999356/features?version=published&key=" + process.env.google_maps_key + "&maxResults=250&callback=jQuery19105907959912437946_1383770388074&dataType=jsonp&jsonpCallback=retrieveTrainsData&contentType=application%2Fjson&_=1383770388076";

      var directions_translate={
        E:  'east',
        N:  'north',
        NE: 'northeast',
        NW: 'northwest',
        S:  'south',
        SE: 'southeast',
        SW: 'southwest',
        W:  'west'
      };

      request({ url: url, timeout: 2000 }, function (error, response, body) {
        if(error || response.statusCode !=200){
          console.error('Failed to fetch Amtrak real-time data!');
          return;
        } 

        //TODO (from Richard): It would eventually be good to transform all of the data into a format
        //that's friendly to the question "What trains arrive at this station when." as
        //the data arrives in a "This is where the trains are now, and these are the stations
        //they are passing through" AND THEN CACHE THE TRANSFORMED DATA

        //Clean up the data
        body=body.replace(/^[^(]*\(/,"").replace(");","");
        body=JSON.parse(body);

        //TODO(Richard): I don't know how Amtrak's API handles DST
        //TODO(Richard): What about Arizona?
        var amtrak_timezones = {"E":'America/New_York', "C":'America/Chicago', "M":'America/Denver', "P":'America/Los_Angeles'};

        var station_count = 0;

        _.each(body.features, function(train){
          _.each(train.properties, function(station,key){
            if(key.substr(0,7)!='Station') return;

            station=JSON.parse(station);

            var timezone = amtrak_timezones[station.tz];
            if(typeof(timezone)==='undefined'){
              console.error('Unrecognised Amtrak timezone: ', station);
              return;
            }

            //TODO(Richard): Discuss the appropriate order here and whether arrivals should be made visually distinct from departures
            var event_time, actual, departure;
            if       (typeof(station.postdep)!=="undefined"){ //We have real-time departure data!
              event_time = station.postdep;
              departure  = true;
              actual     = true;
            } else if(typeof(station.schdep )!=="undefined"){ //Fall back to scheduled departure information
              event_time = station.schdep;
              depature   = true;
              actual     = false;
            } else if(typeof(station.postarr)!=="undefined"){ //Fall back to real-time arrival information
              event_time = station.postarr;
              departure  = false;
              actual     = true;
            } else if(typeof(station.scharr )!=="undefined"){  //fall back to scheduled arrival information
              event_time = station.scharr;
              departure  = false;
              actual     = false;
            } else {
              console.error('Error determining train event time for station: ' + station);
              return;
            }

            event_time=moment(event_time, 'MM/DD/YYYY HH:mm:ss');
            event_time=utility.toMomentInTimezone(event_time, timezone);

            //Train has already left
            if(event_time.unix()<moment().unix())
              return;

            var direction = null;
            if(typeof(train.properties.TrainState)!=='undefined' && train.properties.TrainState=='Predeparture'){
              direction = null;
              console.log('Warning: Amtrak train has undefined direction due to predeparture status.');
              //TODO(Richard): If the train is in a 'Predeparture' state then it
              //does not yet have a defined direction of travel which means that
              //for all of the stations down-track from the originating station
              //I cannot specify a direction of travel. Therefore, this is
              //something of an issue. I'm silencing the log warning for now.
            } else if(typeof(train.properties.Heading)==='undefined' || typeof(directions_translate[train.properties.Heading])==='undefined'){
              console.error('Unrecognised Amtrak train heading: ',train.properties);
            } else {
              direction = directions_translate[train.properties.Heading];
            }

            var result = {
              time:        event_time.unix(),
              direction:   direction,
              route:       train.properties.TrainNum,
              description: train.properties.RouteName,
              actual:      actual,
              departure:   departure,
              updated:     moment().unix()
            };

            station_count++;

            var rediskey="amtrak/"+station.code;
            redisclient.set(rediskey, JSON.stringify(result));

            //Set expiration so that if the updater is running correctly we always have data
            //but also so that the data expires reasonably so that the user is not fed old info
            //TODO(Richard): This should reference the Amtrak updater frequeny somehow
            redisclient.expire(rediskey, 15*60);
          });
        });

        console.log('['+moment().unix().toString()+'] Updater: Amtrak success. ',station_count,' stations added.');
      });
    }
  },

  car2go: {
    onStart:   true,
    frequency: 2*60, //TODO: Is this update frequency okay?
    update: function() {
      console.log('Updater: Car2go started.');

      var CONSUMER_KEY         = process.env.car2go_key;
      var CAR2GO_NAME          = 'car2go';
      var CAR2GO_LOCATIONS_URL = "https://www.car2go.com/api/v2.1/locations?oauth_consumer_key={CONSUMER_KEY}&format=json";
      var CAR2GO_VEHICLES_URL  = "https://www.car2go.com/api/v2.1/vehicles?loc={location}&oauth_consumer_key={CONSUMER_KEY}&format=json";
      var car2go_stop_type     = transit_defs.types.car2go.id;
      var car2go_source_id     = transit_defs.defs.car2go.id;
      CAR2GO_LOCATIONS_URL=CAR2GO_LOCATIONS_URL.replace("{CONSUMER_KEY}",CONSUMER_KEY);
      CAR2GO_VEHICLES_URL=CAR2GO_VEHICLES_URL.replace  ("{CONSUMER_KEY}",CONSUMER_KEY);

      //This is the name of a new Car2Go index
      var car2go_index='car2go-'+moment().format("YYYYMMDDHHmmss");

      request({url:CAR2GO_LOCATIONS_URL,json:true, timeout: 10000}, function (error, response, body) {
        if(error || response.statusCode !=200){
          console.error("Warning: Failed to fetch car2go locations!");
          return; 
        }

        var stops_to_index=[];

        //Loop through the list of locations constructing a list of promises
        //which will be completed once we have added this info to
        //ElasticSearch
        var car2go_loc_promises = _.map(body.location, function(loc,i){
          var deferred = Q.defer();
          request({ url:
            CAR2GO_VEHICLES_URL.replace('{location}', loc.locationName.toLowerCase()),
            timeout: 10000 },
            function(error, response, body) {
              
              if(error || response.statusCode!=200){
                console.log("Error on '"+CAR2GO_VEHICLES_URL.replace('{location}', loc.locationName.toLowerCase())+"': ",error);
                deferred.reject();
                return;
              }

              body = JSON.parse(body);
              body = body.placemarks;

              for(var i in body){
                //Build a real-time object for Redis
                var realtime_info = {
                  vin:        body[i].vin,
                  fuel:       body[i].fuel,
                  interior:   body[i].interior,
                  exterior:   body[i].exterior,
                  engineType: body[i].engineType
                };

                //Load the real-time data into Redis
                var rediskey='car2go/'+body[i].vin;
                redisclient.set(rediskey,JSON.stringify(realtime_info));
                redisclient.expire(rediskey,3*60); //TODO(Richard): Adjust expiration based on Car2Go updater parameters

                //This is the stop affected by the preceeding directive
                var stop_info = {
                  combined_id: car2go_stop_type + '-' + body[i].vin,
                  stop_id:     body[i].vin,
                  source_id:   car2go_source_id,
                  stop_name:   body[i].name,
                  stop_city:   loc.locationName,
                  stop_street: body[i].address.replace(/,.*/,''),
                  location:    [body[i].coordinates[1], body[i].coordinates[0]],
                  stop_type:   car2go_stop_type,
                  stop_url:    'car2go/' + body[i].vin,
                  updated:     moment().unix()
                };

                stops_to_index.push(stop_info);
              }

              deferred.resolve();
            }
          );
          return deferred.promise;
        });
        
        //Once all of the locations have either successfully been added to
        //ElasticSearch or have failed, continue by rotating the indexes.
        //TODO(Richard): Abstract the index rotation.
        Q.allSettled(car2go_loc_promises).fin(function(){
          console.log('Collected all Car2Gos.');
          update_mongo_index(car2go_stop_type, stops_to_index);
        });
      });
    }
  },

  cyclocity: {
    onStart:   true,
    frequency: 5*60,
    update: function() {
      console.log('Updater: Cyclocity started. There will be no success confirmation.');

      var locations_url='https://api.jcdecaux.com/vls/v1/contracts?apiKey=' + process.env.cyclocity_key;
      var location_specific_url='https://api.jcdecaux.com/vls/v1/stations?apiKey=' + process.env.cyclocity_key + '&contract={contract}';
      request({ url: locations_url, timeout: 4000}, function (error, response, body) {
        if(error || response.statusCode!=200){
          console.error('Error acquiring Cyclocity data.');
          return;
        }
        body=JSON.parse(body);
        _.each(body, function(contract,i){
          request({ url: location_specific_url.replace('{contract}',contract.name), timeout: 4000 },
            function (error, response, body) {
              if(error || response.statusCode!=200){
                console.log('Error getting the Cyclocity ' + contract.name + ' contract.');
                return;
              }
              body=JSON.parse(body);
              for(var i=0;i<body.length;i++){
                var result={
                  bikes:      body[i].available_bikes,
                  docksFree:  body[i].available_bike_stands,
                  docksTotal: body[i].bike_stands,
                  open:       (body[i].status=='OPEN'),
                  updated:    body[i].last_update
                };
                var rediskey='cyclocity/'+contract.name.toLowerCase()+'-'+body[i].number;
                redisclient.set(rediskey, JSON.stringify(result));
                //TODO(Richard): Add expiration
              }
              //console.log("Added " + body.length.toString() + " bike stations to " + contract.name);
            }
          );
        });
      });
    }
  },

  pronto: {
    onStart: true,
    frequency: 5*60,

    update: function() {
      console.log('Updater: pronto started.  There will be no success confirmation.');
      var url = "https://secure.prontocycleshare.com/data2/stations.json";
      request({ url: url, timeout: 4000 }, function (error, response, body) {
        if(error || response.statusCode!=200){
          console.error('Error fetching: '+url);
          return;
        }
        
        body=JSON.parse(body);
        helper(body);
        
      });

      function helper(data) {
        var stations = data.stations
       
        _.each(stations, function(station) {
          var rediskey       = 'pronto/'+station.id;
          var availableBikes = station.ba;
          var availableDocks = station.da;
          var totalDocks     = availableBikes + availableDocks;
          var updated        = moment().unix();

          var result={
            bikes:      availableBikes,
            docksFree:  availableDocks,
            docksTotal: totalDocks,
            open:       true,
            updated:    updated
          }; //TODO: Missing API info
          redisclient.set(rediskey, JSON.stringify(result));
        });

      }
    }
  },

  pbsbikes: {
    onStart:   true,
    frequency: 5*60,
    update: function(){
      console.log('Updater: pbsbikes started.  There will be no success confirmation.');

      //Consumes a pbsbikes JavaScript object
      function helper(sys,data){
        var stations;
        if (!data) {
          console.error("There is no data for pbsbikes("+sys.name+")");
          return;
        }
        if(typeof(data.stations)!=="undefined"){
          stations = data.stations.station;
        } else if (typeof(data.stationBeanList)!=="undefined"){
          stations = data.stationBeanList;
        } else {
          console.error("Could not find station list for pbsbikes("+sys.name+")");
          return;
        }

        var added=0;

        for(var i=0;i<stations.length;i++){
          var station        = stations[i];

          var stationid;
          if(typeof(station.id)==='number')
            stationid = station.id;
          else if (typeof(station.id)==='object')
            stationid = station.id[0];
          else {
            console.error("Error: Unrecognised pbsbikes station id",station.id);
            return;
          }

          var rediskey       = sys.name.toLowerCase()+'/'+stationid;
          var availableBikes = 0;
          var availableDocks = 0;
          var totalDocks     = 0;
          var updated        = moment().unix();
          if(typeof(station.nbBikes)!=='undefined'){
            availableBikes = parseInt(station.nbBikes[0],10);
          } else if (typeof(station.availableBikes)!=='undefined'){
            availableBikes = station.availableBikes;
          } else {
            console.log('Could not find number of bikes',station);
            continue;
          }

          if(typeof(station.availableDocks)!=="undefined") {
            availableDocks = station.availableDocks;
          } else if(typeof(station.nbEmptyDocks)!=='undefined') {
            availableDocks = parseInt(station.nbEmptyDocks[0],10);
          } else {
            console.error("Unable to find number of available docks",station);
            continue;
          }

          if(typeof(station.latestUpdateTime)!=='undefined' && typeof(station.latestUpdateTime[0])!=='undefined')
            updated = parseInt(station.latestUpdateTime[0],10);
          else if (typeof(station.lastCommunicationTime)!=='undefined' && typeof(station.lastCommunicationTime)!==null)
            updated = station.lastCommunicationTime;
          else {
            //console.error("Unable to find update time in pbsbikes: ", station);
          }

          if(typeof(station.totalDocks)!=="undefined") {
            totalDocks = station.totalDocks;
          } else {
            totalDocks = availableBikes + availableDocks;
          }

          var open = true;
          if(typeof(station.locked)!=='undefined' && typeof(station.locked[0])!=='undefined' && station.locked[0]=='true')
            open = false;
          else if (typeof(station.statusValue)!=='undefined' && station.statusValue=='Not In Service')
            open=false;
          else if (typeof(station.statusKey)!=='undefined' && station.statusKey!=1){
            console.log('pbsbikes status: ', station.statusValue);
            open = false;
          }

          added+=1;
          var result={
            bikes:      availableBikes,
            docksFree:  availableDocks,
            docksTotal: totalDocks,
            open:       open,
            updated:    updated
          }; //TODO: Missing API info
          redisclient.set(rediskey, JSON.stringify(result));
          //console.log(rediskey,JSON.stringify(result));
          //TODO(Richard): Add expiration
        }

        //console.log("Added " + added.toString() + " bike stations to " + sys.name);
      }

      //Loops through all transit_defs looking for those that use the "pbsbikes" stopparser (aka: this code)
      _.each(transit_defs.defs, function(sys,i){
        if(sys.stopparser && sys.stopparser.substr(0,8)=='pbsbikes'){
          request({ url: sys.stopdata, timeout: 4000 }, function (error, response, body) {
            if(error || response.statusCode!=200){
              console.error('Error fetching: '+sys.stopdata);
              return;
            }
            if(response.headers['content-type']=='application/xml' || response.headers['content-type']=='text/xml'){
              xml2js(body, function(err,result){helper(sys,result);});
            } else {
              body=JSON.parse(body);
              helper(sys, body);
            }
          });
        }
      });
    }
  },

  bcycle: {
    onStart:   true,
    frequency: 5*60,
    update: function(){
      console.log('Updater: Bcycle started. There will be no success confirmation.');

      function formURL(address){
        return {
          url: address,
          headers: {
            ApiKey: process.env.bcycle_key,  //Bcycle API key
            'Cache-Control': 'no-cache'
          }
        };
      }

      var ListProgramsURL='https://publicapi.bcycle.com/api/1.0/ListPrograms';

      //Translates the station status into a boolean value indicating if the station is open
      var translate_status = {
        Active:         true,
        Unavailable:    false,
        ComingSoon:     false,
        PartialService: true,
        SpecialEvent:   true
      };

      //Collect list of locations with Bcycle programs
      request({ url: formURL(ListProgramsURL), timeout: 10000 }, function (error, response, body) {
        
        if(error || response.statusCode!=200){
          console.error('Error fetching Bcycle Program List');
          return;
        }

        body=JSON.parse(body);

        _.each(body, function(program, i){
          var program_url='https://publicapi.bcycle.com/api/1.0/ListProgramKiosks/'+program.ProgramId;
          request({ url: formURL(program_url), timeout: 10000 }, function(error, response, stopbody){
            stopbody=JSON.parse(stopbody);
            if(error || response.statusCode!=200){
              console.error('Error fetching Bcycles for: ' + program.Name);
              return;
            }

            for(var i in stopbody){
              var station=stopbody[i];
              var rediskey='bcycle/'+station.Id;

              var status = station.Status;
              if(typeof(translate_status[status])!=='undefined')
                status = translate_status[status];
              else
                console.error('Unknown Bcycle station status: ', status);

              var result={
                bikes:      station.BikesAvailable,
                docksFree:  station.DocksAvailable,
                docksTotal: station.TotalDocks,
                open:       status,
                updated:    moment().unix()
              };
              redisclient.set(rediskey, JSON.stringify(result));
              //TODO(Richard): Add expiration date
            }

            //console.log('Added '+stopbody.length.toString()+' bike stations to '+program.Name);
          });
        });
      });
    }
  },

  bart: {
    onStart:   true,
    frequency: 1*60,
    update: function(){
      console.log('Updater: BART started.');

      url='http://api.bart.gov/api/etd.aspx?cmd=etd&orig=all&key=' + process.env.bart_key;
      request({ url: url, timeout: 10000 }, function (error, response, body) {
        if(error || response.statusCode !=200){
          console.error('Error: Failed to fetch BART real-time data!');
          return;
        } 
        xml2js(body, function(err,result){
          if(err){
            console.error('Error: Failed to parse BART XML!');
            return;
          }

          result = result.root;

          var updated_day  = result.date[0];
          var updated_time = result.time[0];
          var updated      = updated_day+' '+updated_time;
          updated = updated.substr(0,updated.lastIndexOf(' '));
          updated = moment(updated,'MM/DD/YYYY hh:mm:ss A');
          updated = utility.toMomentInTimezone(updated,'America/Los_Angeles');

          var directions_translate={North:'north',South:'south',East:'east',West:'west'};

          _.each(    result.station, function(station ){
            var etd_list=[];
            _.each(  station.etd,    function(etd     ){
              _.each(etd.estimate,   function(estimate){

                var departing = estimate.minutes[0];
                if(departing=='Leaving'){
                  departing = 0;
                } else {
                  departing = parseInt(departing,10);
                }

                departing = moment().unix()+departing*60;

                var direction=estimate.direction[0];
                if(typeof(directions_translate[direction])==='undefined'){
                  console.log('Warning: Unrecognised BART direction: ',direction);
                } else {
                  direction=directions_translate[direction];
                }

                var etd_datum = {
                  time:           departing,
                  direction:      direction,
                  route:          etd.abbreviation[0],
                  description:    etd.destination[0],
                  actual:         true,
                  departure:      true,
                  updated:        updated,
                  platform:       estimate.platform[0]
                };

                etd_list.push(etd_datum);
              });
            });
            var rediskey = 'bart/' + station.abbr[0].toLowerCase();

            etd_list.sort(function(a,b){return a.time-b.time;});
            redisclient.set(rediskey,JSON.stringify(etd_list));
            redisclient.expire(rediskey,90);
          });
        });

        console.log('Updater: BART success.');
      });
    }
  }

};







//-------------------------------------------------
//START-UP UPDATERS
//-------------------------------------------------

//TODO(Richard): These updaters should probably launch themselves in background
//processes
//Richard look below... You should fork a child process for these.
//when they trigger... or something.
function init_updaters(){
  console.log("Initializing updater process.");
  _.each(updaters, function(i,updatername){
    var updater=updaters[updatername];
    var now_timestamp=Date.now()/1000;
    if(!updater.onStart)
      return;

    redisclient.get(updatername+"-lastupdate", function(err, reply) {
      reply=parseInt(reply);
      if(reply && now_timestamp-reply<updater.frequency){
        var delay=(reply+updater.frequency)-now_timestamp;
        console.log('Delaying start-up update for "'+updatername+'" by ' +delay.toString()+' seconds');
        setTimeout(
          function(){
            console.log('Delayed update for "'+updatername+'" initiated.');
            updater.update();
            redisclient.set(updatername+"-lastupdate", Date.now()/1000);
            setInterval(updater.update, updater.frequency*1000); //Now set up the repeating job
          },
          delay*1000
        );
      } else {
        console.log("Running start-up update for "+updatername);
        updater.update();
        redisclient.set(updatername+"-lastupdate", Date.now()/1000);
        setInterval(updater.update, updater.frequency*1000); //Now set up the repeating job
      }
    });
  });

}

init_updaters();