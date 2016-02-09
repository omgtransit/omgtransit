var Q = require('q');
var request = require('request');
var parser = require('../lib/parser');

/* =======================================================
 * Rideshare: Uber
 * Interacts with the Uber API.
 ========================================================= */

 var Uber = {
  estimated: function(lat, lon) {

    var deferred = Q.defer();
    var url = 'https://api.uber.com/v1/estimates/time?start_latitude=' + lat + '&start_longitude=' + lon;

    request({
      timeout: 2000,
      url: url,
      headers: {
        'Authorization': 'Token ' + process.env.uber_key
      },
    }, function(error, response, body) {
      if(error || response.statusCode!=200){
        deferred.resolve({ name: 'uber', error: 'error' });
        return deferred.promise;
      }
      
      body = JSON.parse(body);
      body.name = 'uber';
      deferred.resolve( body );
    });

    return deferred.promise;
  }
}

exports.UBER = Uber;

/* =======================================================
 * Rideshare: Sidecar
 * Interacts with the Sidecar API.
 ========================================================= */

 var Sidecar = {
  estimated: function(lat, lon) {
    return rideshare(lat, lon, 'sidecar')
  }
}

exports.SIDECAR = Sidecar;

/* =======================================================
 * Rideshare: Hailo
 * Interacts with the Hailo API.
 ========================================================= */

 var Hailo = {
  estimated: function(lat, lon) {
    return rideshare(lat, lon, 'hailo');
  }
}

exports.HAILO = Hailo;

// Generic rideshare operation.

function rideshare(lat, lon, system) {
  
  var url;
  var deferred = Q.defer();
  var self = this;
  
  if ( system === 'sidecar' ) {
    url = 'https://api.side.cr/vehicle/getNearbyDrivers/' + lat + '/' + lon + '/' + process.env.sidecar_key;
  }

  if ( system === 'hailo' ) {
    url = 'https://api.hailoapp.com/drivers/eta?api_token=' + process.env.hailo_key + '&latitude=' + lat + '&longitude=' + lon;
  }

  request({
      timeout: 2000, 
      url: url
    }, function (error, response, body) {
    
    if(error || response.statusCode!=200) {
      deferred.resolve({ name: system, error: 'error' });
      return deferred.promise;
    }
    body=JSON.parse(body);
    body.name = system;
    deferred.resolve( body );
  });

  return deferred.promise;
  
};
