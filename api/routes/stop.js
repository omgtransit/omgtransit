
/*
 * GET table.
 */

var parser       = require('../lib/parser');
var utility      = require('../lib/utility');
var _            = require('lodash');
var transit_defs = require('../lib/transit_defs');
var Q            = require('q');
var realtime     = require('../lib/realtime.js');
var Db           = require('mongodb').Db;
var mongoClient;
var request      = require('request');
var rideshares = require('../lib/rideshares');

require('log-timestamp');

Db.connect(process.env.mongo_host, function(err, db) {
  if(err) {
    console.log("Error Starting up Mongo!@");
    console.log(err);
    return;
  }
  console.log('Starting up mongo.');
  mongoClient = db;

});

function findNearbyStops(req, res) {
  var deferred = Q.defer();
  var filter = {};
  var distance = 10;
  var num = 30;

  if (req.query.limit) {
    num = req.query.limit;
  }
  
  if (req.query.filter) {
    var types = req.query.filter.split(',');
    types = _.map(types, function(type){ return parseInt(type, 10); });
    
    // If filtering, let's go 15mi out.
    distance = '15';
    filter.stop_type = { $in: types };
  }

  mongoClient.collection('mongo_stops').geoNear(parseFloat(req.query.lat), parseFloat(req.query.lon), {$maxDistance: distance, num: parseInt(num), query: filter, distanceMultiplier: (3963.1676 * Math.PI / 180.0) }, function(err, result) {
    if(err) {
      res.writeHead(401);
      res.end();
      return console.dir(err);
    }
    res.json( parser.parsers.stop_bulk_format(result.results) );
  });
}

exports.list = function(req, res) {

  // Add CORS headers
  loadCORS(res);

  findNearbyStops(req, res);
};

exports.bounds = function(req, res) {
  
  // Add CORS headers
  loadCORS(res);

  req.query.lat = req.query.centerLat;
  req.query.lon = req.query.centerLng;
  req.query.limit = 20;

  findNearbyStops(req, res);
};

exports.get = function(req, res) {
  
  // Add CORS headers
  loadCORS(res);

  var system = req.params.system.toLowerCase();
  var stopid = req.params.stopid;

  if (system !== 'car2go' && system !== 'soundtransit') {
    stopid = stopid.toLowerCase();
  }

  system = transit_defs.defs[system].id;
  
  mongoClient.collection('mongo_stops').find({ source_id: system, stop_id: stopid}).toArray(function(err, response) {
    if(err) {
      res.writeHead(401);
      res.end();
      return console.dir(err);
    }
    var stop = parser.parsers.stop_format(response[0]);
    stop.distance = 0;
    res.json( stop );
  });
};

exports.routes = function(req, res) {

  // Add CORS headers
  loadCORS(res);

  var filter = {};
  filter.stop_type = { $in: [1] };

  mongoClient.collection('mongo_stops').geoNear(parseFloat(req.query.lat), parseFloat(req.query.lon), {$maxDistance: 0.5, num: 30, query: filter, distanceMultiplier: (3963.1676 * Math.PI / 180.0) }, function(err, result) {
    if(err) {
      res.writeHead(401);
      res.end();
      return console.dir(err);
    }
    if( result.results.length === 0){
      res.json(false);
      return;
    }

    var stop_promises=_.map(result.results, function(stop){
      stop._source.distance=stop.sort[0];
      stop = stop._source;

      var deferred     = Q.defer();
      var realtimestop = new realtime.Realtime(stop.stop_url.toLowerCase());

      realtimestop.getRealtime().then(function(result){
        stop.routes = result;
        deferred.resolve(stop);
      }).catch(function(err){
        deferred.reject();
      });

      return deferred.promise;
    });

    Q.allSettled(stop_promises).then(function(promises){
      promises=_.filter(promises, function(p){return p.state==='fulfilled';});
      promises.sort(function(a,b){return a.value.distance-b.value.distance;});

      var routes_seen = {};
      var routes      = [];
      _.each(promises,function(stop){
        stop = stop.value;
        _.each(stop.routes, function(route){
          if(typeof(routes_seen[route.route])==='undefined'){
            var route_obj = {
              stop_url:          stop.stop_url,
              stop_distance:     stop.distance,
              stop_location:     {lat:stop.location[1], lon:stop.location[0]},
              stop_name:         stop.stop_name,
              stop_type:         stop.stop_type,
              route_route:       route.route,
              route_description: route.description,
              route_direction:   route.direction,
              times:             []
            };
            routes_seen[route.route] = route_obj;
            routes.push(route_obj);
          }

          if(routes_seen[route.route].stop_url==stop.stop_url){
            console.log(routes_seen[route.route].stop_url,stop.stop_url);
            var time_event = {
              time:      route.time,
              actual:    route.actual,
              departure: route.departure,
              updated:   route.updated
            };
            routes_seen[route.route].times.push(time_event);
          }
        });
      });

      res.json(routes);
    });
  });
};


/* =======================================================
 * GET rideshares/:lat/:lon
 * Loads all the rideshare options in one method.
 ========================================================= */

exports.rideshares = function(req, res) {
  loadCORS(res);

  var rideshareOptions = [
    { name: 'UBER' },
    { name: 'SIDECAR' },
    { name: 'HAILO' }
  ];

  var ridesharePromises = [];
  var results = [];
  var lat = req.query.lat;
  var lon = req.query.lon;

  for(var i = 0, len = rideshareOptions.length; i < len; i++) {
    ridesharePromises.push( rideshares[rideshareOptions[i].name].estimated(lat, lon) );
  }

  Q.all(ridesharePromises).then(function(results) {
    res.json( results );
  });

};

/* =======================================================
 * GET rideshare/:system/:lat/:lon
 * Loads one rideshare option
 ========================================================= */

exports.rideshare = function(req, res) {
  // Add CORS headers
  loadCORS(res);

  var system = req.params.system.toLowerCase();
  var lat = req.params.lat;
  var lon = req.params.lon;
  var url;
  var deferred = Q.defer();
  var self = this;
  
  if ( system === 'sidecar' ) {
    url = 'https://api.side.cr/vehicle/getNearbyDrivers/' + lat + '/' + lon + '/' + process.env.sidecar_key;
  }

  if ( system === 'hailo' ) {
    url = 'https://api.hailoapp.com/drivers/eta?api_token=' + process.env.hailo_key + '&latitude=' + lat + '&longitude=' + lon;
  }

  request({ url:url, timeout: 4000 }, function (error, response, body) {
    if(error || response.statusCode!=200){
      console.dir(error);
      deferred.resolve(false)
      return deferred.promise;
    }
    
    body=JSON.parse(body);
    if(self.parser)
      body = parser.parsers[self.parser](body);
      deferred.resolve( body );
      res.json(body);
    
  });

  return deferred.promise;
  
};

exports.uber = function(req, res) {
  // Add CORS headers
  loadCORS(res);

  var deferred = Q.defer();
  var lat = req.params.lat;
  var lon = req.params.lon;

  var url = 'https://api.uber.com/v1/estimates/time?start_latitude=' + lat + '&start_longitude=' + lon;

  request({
    url: url,
    timeout: 4000,
    headers: {
      'Authorization': 'Token ' + process.env.uber_key
    },
  }, function(error, response, body) {
      console.log(error);

    if(error || response.statusCode!=200){
      deferred.resolve(false)
      return deferred.promise;
    }

    body = JSON.parse(body);
    deferred.resolve( body );
    res.json(body);
  });

  return deferred.promise;
};

process.on('uncaughtException', function (error) {
  console.log(error.stack);
});

function loadCORS(res) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
}