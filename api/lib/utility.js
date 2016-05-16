var request      = require('request');
var Q            = require('q');
var redis        = require("redis");
var redisclient  = redis.createClient('6379', process.env.redis_host);
var _            = require('lodash');
var transit_defs = require('../lib/transit_defs');
var moment       = require('moment-timezone');

var Db           = require('mongodb').Db;
var mongoClient;
Db.connect(process.env.mongo_host, function(err, db) {
  if(err) {
    console.log("Error Starting up Mongo!@");
    console.log(err);
    return;
  }
  console.log('Starting up mongo.');
  mongoClient = db;

});

//Fetchs and catches a URL. Returns cached value if it isn't expired.
//@param[in] url        URL to fetch
//@param[in] expiration Number of seconds after which the cache should expire
exports.fetchncache = function(url,expiration){
  var deferred = Q.defer();

  redisclient.get(url,
    function(err, reply) {
      if(err){
        deferred.reject('Failed to get Redis key: '+url);
      } else if (reply) {
        console.log('Found content for: '+url);
        deferred.resolve(JSON.parse(reply));
      } else {
        console.log('Fetching: ' + url);
        request({ url: url, timeout: 3000}, function (error, response, body) {
          //console.log("Fetched: "+body); //TODO(Richard): Remove
          if(error || response.statusCode!=200){
            deferred.reject('Request failed for: '+url);
          } else {
            redisclient.set(url, body);
            //redisclient.expire(url, expiration); //TODO(Richard): Adjust this as it will probably change for things like rush hour in larger cities
            deferred.resolve(JSON.parse(body));
          }
        });
      }
    }
  );

  return deferred.promise;
};

//Find stops of a given type within radius of (lat,lon)
//@param[in] lat        Latitude of center of search
//@param[in] lon        Longitude of center of search
//@param[in] radius     Radius of search (e.g. '10mi' or '5km')
//@param[in] stop_type  Optionally a stop_type, such as 'car2go' or 'bus'
//
//Returns: A list of stops with their associated data
exports.get_stops_near = function(lat,lon,radius,stop_type){
  var deferred = Q.defer();
  var filter   = {};
  var distance = 10;

  lat    = parseFloat(lat);
  lon    = parseFloat(lon);
  radius = parseInt(radius,10);

  if(typeof(stop_type)!=="undefined"){
    if(typeof(transit_defs.types[stop_type])==="undefined"){
      console.log('Reject!');
      deferred.reject("Undefined stop type: "+stop_type);
      return deferred.promise;
    }
    console.log('Using stop type '+transit_defs.types[stop_type].id.toString() + ' as '+stop_type);
    filter.stop_type = { $in: [transit_defs.types[stop_type].id] };
  }

  mongoClient.collection('mongo_stops').geoNear(lat, lon, {$maxDistance: radius, num: 30, query: filter, distanceMultiplier: (3963.1676 * Math.PI / 180.0) }, function(err, result) {
    if(err || result.results.length==0){
      if(err){
        console.error("MongoDB get_stops_near error",err);
      }
      deferred.reject("No stops found.");
      return;
    }
    deferred.resolve(_.map(result.results,function(obj) {return obj.obj;}));
  });

  return deferred.promise;
};



//NOTE(Richard): This is a patch until the Moment Timezone library incorporates
//this kind of feature by default. Note that it sets the timezone based on the
//appropriate offset for the moment this function is called, not the time
//specified by sourceMoment. As such, this may be wrong on during daylight
//savings time.
exports.toMomentInTimezone = function(sourceMoment, timezone) {
  var result = moment.tz(timezone);
  result.year       (sourceMoment.year()       );
  result.month      (sourceMoment.month()      );
  result.date       (sourceMoment.date()       );
  result.hour       (sourceMoment.hour()       );
  result.minute     (sourceMoment.minute()     );
  result.second     (sourceMoment.second()     );
  result.millisecond(sourceMoment.millisecond());
  return result;
};