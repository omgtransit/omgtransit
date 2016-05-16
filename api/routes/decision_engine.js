//See: https://en.wikipedia.org/wiki/Tobler's_hiking_function

//cals are in Calories/hr for a 180lb person
var calories = {
  walking:   270,
  bicycling: 490,
  driving:   123,
  transit:   123    //Calories for sitting with light office work, 180lb
};

var outside = {
  walking:   true,
  bicycling: true,
  driving:   false,
  transit:   false
};

var request     = require('request');
var Q           = require('q');
var redis       = require("redis");
var utility     = require('../lib/utility');
var _           = require('lodash');
var moment      = require('moment-timezone');





//Makes a caching call to google looking for directions from <origin> to <destination>
//using <mode> leaving at <departure_time>
//@param[in] origin          Lat,Lon (YY.YYY,XX.XXX)
//@param[in] destination     Lat,Lon (YY.YYY,XX.XXX)
//@param[in] mode            walking,bicycling,driving,transit
//@param[in] start_time      e.g. "2014-02-25T15:24:20-08:00" (from NoiseBridge in San Fran)
//
//@return Parsed JSON object from Google Directions API
function callgoogle(origin, destination, mode, start_time){
  var gurl="https://maps.googleapis.com/maps/api/directions/json?sensor=false";

  //Extracts the Unix Epoch from the departure_time
  start_time=moment(start_time).utc().valueOf()/1000;

  gurl += "&origin="+origin;
  gurl += "&destination="+destination;
  gurl += "&mode="+mode;
  if(typeof(start_time)!=="undefined")
    gurl += "&departure_time="+start_time;

  return utility.fetchncache(gurl,60*60,false); //TODO(Richard): Decrease this
}


//Calculates all the relevant values of a route from <origin> to <destination>
//using <mode> leaving at <departure_time>
//@param[in] origin          Lat,Lon (YY.YYY,XX.XXX)
//@param[in] destination     Lat,Lon (YY.YYY,XX.XXX)
//@param[in] mode            walking,bicycling,driving,transit
//@param[in] weather         A parsed JSON weather object from Forecast.IO
//@param[in] start_time      e.g. "2014-02-25T15:24:20-08:00" (from NoiseBridge in San Fran)
//
//@return Pulls out the first routing option from the Google Directions API return
//and does value-adding to it
function calcjourney(origin, destination, mode, weather, start_time){
  var deferred = Q.defer();

  callgoogle(origin, destination, mode, start_time).then(function(ret){
    if(ret.status=='ZERO_RESULTS'){
      deferred.reject('No viable routes found.');
      return;
    }
    if(ret.status!='OK'){
      deferred.resolve(false);
      return;
    }

    _.each(ret.routes, function(route,j){
      route.waitingtime   = 0;
      route.frostbite     = false;
      route.calories      = 0;
      route.outtime_max   = 0;
      route.outtime_total = 0;
      route.sunscreen     = false;
      route.umbrella      = false;
      route.travel_times  = {};
      route.travel_dists  = {};

      var trip_start,trip_end,start_hour;
      if(mode=='transit'){
        trip_start = route.legs[0].departure_time.value;
        trip_end   = route.legs[0].arrival_time.value;
        start_hour = moment(route.legs[0].departure_time.value).tz(route.legs[0].departure_time.time_zone).hour();
      } else {
        trip_start = Date.now();
        trip_end   = trip_start + route.legs[0].duration.value;
        start_hour = start_time.substr(0,start_time.indexOf(':'));
      }

      //How long do we spend outdoors?
      var outtimes=_.filter(
        _.map(route.legs[0].steps,
          function(obj){
            if(obj.transit_details)
              return [obj.transit_details.departure_time.value,obj.transit_details.arrival_time.value];
            else
              return false;
          }
        ),
        function(x){return x;}
      );
      outtimes=[[false, trip_start]].concat(outtimes);
      outtimes=outtimes.concat([[trip_end,false]]);

      for(var i=1;i<outtimes.length;i++){
        var tdiff = outtimes[i][0]-outtimes[i-1][1];
        route.outtime_total += tdiff;
        route.outtime_max    = Math.max(route.outtime_max,tdiff);
      }

      if(mode=='driving'){
        route.outtime_total = 4; //NOTE(Richard): Just a random guess
        route.outtime_max   = 2;
      }
      route.outtime_total /= 60;
      route.outtime_max   /= 60;

      //How long do we spend engaged in various modes of travel?
      for(var i=0;i<route.legs[0].steps.length;i++){ //Valid for routes without waypoints
        var step        = route.legs[0].steps[i];
        var travel_mode = step.travel_mode.toLowerCase();

        if(typeof(route.travel_dists[travel_mode])==="undefined")
          route.travel_dists[travel_mode]=0;
        if(typeof(route.travel_times[travel_mode])==="undefined")
          route.travel_times[travel_mode]=0;

        route.travel_dists[travel_mode] += step.distance.value; //metres
        route.travel_times[travel_mode] += step.duration.value/60; //seconds

        route.calories += step.duration.value/3600.0*calories[travel_mode];
      }

      if(route.outtime_max>0){
        var windSpeed     = weather.currently.windSpeed;
        var temperature   = weather.currently.temperature;
        var apparentTemp  = weather.currently.apparentTemperature;
        if(mode=='bicycling' && route.outtime_max>=time_to_frostbite(windchill_temp(windSpeed+10,temperature))){
          route.frostbite=true;
        } else if (route.outtime_max>=time_to_frostbite(windchill_temp(windSpeed,temperature))){
          route.frostbite=true;
        } else if ( route.outtime_max>=15 && 11<=start_hour && start_hour<=16 && apparentTemp>=55){ //TODO(Richard): And make sure the sun is out
          route.sunscreen=true;
        }

        //Light rain according to: http://wiki.sandaysoft.com/a/Rain_measurement#Rain_Rate
        //TODO(Richard): Consider adding a rain-pants qualifier if the windspeed is high
        if(route.outtime_max>=5 && 1<=weather.currently.precipIntensity && temperature>=32){
          route.umbrella = true;
        }
      }

      if(mode=='transit'){
        //TODO(Richard): Figure out why this sometimes goes negative
        if(route.outtime_total<route.travel_times.walking)
          route.outtime_total=route.travel_times.walking;
        route.waitingtime=route.outtime_total-route.travel_times.walking;
      }
    });

    deferred.resolve(ret.routes[0]);
  });

  return deferred.promise;
}


//Calculates the apparent temperature given the windspeed and the ambient temperature
//This is based on "https://en.wikipedia.org/wiki/Wind_chill" but may contain original work by Richard
function windchill_temp(windspeed, temp){
  if(temp>=40)
    return temp;
  else if(windspeed<=3)
    return temp;
  else
    return 35.74 + 0.6215*temp - 35.75*Math.pow(windspeed,0.16) + 0.4275*temp*Math.pow(windspeed,0.16);
}

//Returns the number of minutes until frostbite risk given an apparent temperature.
//This is based on interpolations by Richard and may not be the best way of doing this (TODO).
function time_to_frostbite(temp){
  if(temp>34)        //Infinity
    return 1.0/0.0;
  else if(temp>0)    //30 minutes to frostbite
    return 30.0;
  else if (temp>-39) //10 minutes
    return 10.0;
  else if (temp>-64) //5 minutes
    return 5.0;
  else
    return 5.0;
}

//Takes a location in (YY.YYY,XX.XXX) (Lat, Lon) format and returns a parsed
//JSON object from Forecast.IO containing the current weather conditions for that location.
//Current weather info is in a currently property and hourly data for the next 48 hours is
//in the hourly property
//See: https://developer.forecast.io/docs/v2 for more info
function getweather(location){
  var url="https://api.forecast.io/forecast/" + process.env.forecast_io_key + "/{location}?exclude=minutely,daily,flags&units=us";
  url=url.replace('{location}',location);

  return utility.fetchncache(url,30*60,true); //TODO(Richard): Find a godo value for this
}

//Given a list of waypoints and travel modes this returns a route which passes
//through them.
//@param[in] waypoints  [ ['LAT,LON',MODE1],['LAT,LON',MODE2],...,['LAT,LON','NULL']]
//@param[in] weather    A parse JSON object returned from Forecast.IO with the current weather conditions
//@param[in] start_time e.g. "2014-02-25T15:24:20-08:00" (from NoiseBridge in San Fran)
//
//@return Returns an object with an **agg** property which contains aggregate value-added information
//of multiple calls to calcjourney(). The results of these calls and their value-adding are stored
//in the objects **metalegs** property.
function multi_modal_trip(waypoints, weather, start_time){
  var deferred  = Q.defer();

  var returns = [];
  for(var i=0;i<waypoints.length-1;i++)
    returns.push(calcjourney(waypoints[i][0],waypoints[i+1][0],waypoints[i][1],weather,start_time));

  Q.all(returns).then(function(result){
    result                   = {metalegs:result};
    result.agg               = {};
    result.agg.waitingtime   = 0;
    result.agg.frostbite     = false;
    result.agg.calories      = 0;
    result.agg.outtime_max   = 0;
    result.agg.outtime_total = 0;
    result.agg.sunscreen     = false;
    result.agg.umbrella      = false;
    result.agg.travel_times  = {};
    result.agg.travel_dists  = {};

    for(var i=0;i<result.metalegs.length;i++){
      result.agg.waitingtime   += result.metalegs[i].waitingtime;
      result.agg.calories      += result.metalegs[i].calories;
      result.agg.outtime_max   += result.metalegs[i].outtime_max;
      result.agg.outtime_total += result.metalegs[i].outtime_total;
      result.agg.umbrella       = result.agg.umbrella  || result.metalegs[i].umbrella;
      result.agg.frostbite      = result.agg.frostbite || result.metalegs[i].frostbite;
      result.agg.sunscreen      = result.agg.sunscreen || result.metalegs[i].sunscreen;
      for(var j in result.metalegs[i].travel_times){
        if(typeof(result.agg.travel_times[j])==="undefined")
          result.agg.travel_times[j]=0;
        if(typeof(result.agg.travel_dists[j])==="undefined")
          result.agg.travel_dists[j]=0;
        result.agg.travel_times[j]+=result.metalegs[i].travel_times[j];
        result.agg.travel_dists[j]+=result.metalegs[i].travel_dists[j];
      }
    }
    deferred.resolve(result);
  }).catch(function(err){
    deferred.resolve('Metalegs: '+err);
  });

  return deferred.promise;
}



//Calculates all the relevant values of a route from <origin> to <destination>
//using <mode> leaving at <departure_time>
//@param[in] origin          Lat,Lon (YY.YYY,XX.XXX)
//@param[in] destination     Lat,Lon (YY.YYY,XX.XXX)
//@param[in] mode            walking,bicycling,driving,transit
//@param[in] start_time      e.g. "2014-02-25T15:24:20-08:00" (from NoiseBridge in San Fran)
//
//@return Returns an object with a **mode** property indicating the queried mode
//a **status** property which is either 'ok' or 'error'. If the status is 'ok' there
//is a **result** property containing the result of calls to calc_journey() or multi_modal_trip().
//If the status is 'error' then there is a **message** property containing an explanation
//of the error
function do_trip(origin,destination,mode,start_time, weather){
  var deferred  = Q.defer();

  if(mode=='bikeshare'){
    var origin_split = origin.split(',');
    var dest_split   = destination.split(',');
    var bike_rental_start = utility.get_stops_near(origin_split[0], origin_split[1], '1mi', 'bike');
    var bike_rental_end   = utility.get_stops_near(dest_split[0], dest_split[1], '1mi', 'bike');

    Q.all([bike_rental_start,bike_rental_end]).spread(
      function(brstart, brend){
        var bike_rental_start = brstart[0].location[1].toString()+','+brstart[0].location[0].toString();
        var bike_rental_end   = brend[0].location[1].toString()+','+brend[0].location[0].toString();

        var trip=[ [origin,'walking'], [bike_rental_start,'bicycling'], [bike_rental_end,'walking'], [destination,'null'] ];

        return multi_modal_trip(trip, weather, start_time).then( function(result){
          deferred.resolve({mode:mode,status:'ok',result:result});
        }).catch(function(err){
          deferred.resolve({mode:mode,status:'error',message:"No rental bikes found in your area."});
          return;
        });
      }
    ).catch(function(err){
      deferred.resolve({mode:mode,status:'error',message:err});
      return;
    });
  } else if(mode=='car2go'){
    var origin_split = origin.split(',');
    var car2go_start = utility.get_stops_near(origin_split[0], origin_split[1], '1mi', 'car2go');

    car2go_start.then( function(car2gos){
      var car2go_loc = car2gos[0].location[0].toString()+','+car2gos[0].location[1].toString();

      var trip = [ [origin,'walking'], [car2go_loc,'driving'], [destination, 'null']];

      multi_modal_trip(trip, weather, start_time).then( function(result){
        deferred.resolve({mode:mode,status:'ok',result:result});
      }).catch(function(err){
        deferred.resolve({mode:mode,status:'error',message:err});
      });
    }).catch(function(err){
      deferred.resolve({mode:mode,status:'error',message:"No Car2Go's found in your area."});
    });
  } else if(mode=='walking' || mode=='bicycling' || mode=='transit' || mode=='driving'){
    console.log('Calculating journey for: ',mode,origin,destination,mode,start_time);
    calcjourney(origin,destination,mode,weather,start_time).then(function(result){
      deferred.resolve( {mode:mode,status:'ok',result:result} );
    }).catch(function(err){
      deferred.resolve({mode:mode,status:'error',message:err});
    });
  } else {
    deferred.resolve({mode:mode,status:'error',message:"Unrecognised decision engine transit mode: "+mode});
  }

  return deferred.promise;
}



exports.engine = function(req, res){
  // Add CORS headers
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  var modes    = req.params.mode.split(',');
  var searches = [];

  getweather(req.params.origin).then(function(weather){

    for(var i=0;i<modes.length;i++)
      searches.push(do_trip(req.params.origin,req.params.destination,modes[i],req.params.start_time,weather));

    Q.all(searches).then(function(reply){
      reply.push({mode:'weather', status:'ok', result:weather});
      res.json(reply);
    });

  }).catch(function(err){

    console.error('TODO(Richard): Come up with some kind of fabulous back-up plan in-case the weather is unavailable!');
    console.error(err);
    res.json({mode:mode,status:'error',message:"Failed to get weather!"});

  });

  //TODO(Richard): Once we get the kinks sorted out, use this instead - or some other nice system of letting the user know it isn't working.
  //res.writeHead(401);
  //res.end();
};