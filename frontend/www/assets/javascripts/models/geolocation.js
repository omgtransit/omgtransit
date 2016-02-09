Omg.Models.Geolocation = Backbone.Model.extend({
  
  initialize: function() {
    // Geolocation represents the users current location.
    this.getItem('geolocation');

    // Current Postion is where the user has panned to on the map.
    this.getItem('current_position');
  },

  getCascadeLocation: function() {
    // There are many issues with geolocation.  
    // This one attempts high accuracy first, then tries low before giving up.
    
    var q = $.Deferred();
    var self = this;
    var locationTimeout;

    if (navigator.geolocation) {
      locationTimeout = setTimeout(function() {
        q.reject('timeout');
      }, 13000);

      navigator.geolocation.getCurrentPosition(function (result) {
        // High accuracy.
        clearTimeout(locationTimeout);

        var coords = { lat: result.coords.latitude, lon: result.coords.longitude };
        self.saveItem('geolocation', coords);
        self.saveItem('current_position', coords);
        q.resolve(coords);
      }, function (err) {
        
        // Low accuracy.
        navigator.geolocation.getCurrentPosition(function (result) {
          clearTimeout(locationTimeout);
          var coords = { lat: result.coords.latitude, lon: result.coords.longitude };
          self.saveItem('geolocation', coords);
          self.saveItem('current_position', coords);
          q.resolve(coords);
        }, function( err ) {
          clearTimeout(locationTimeout);
          q.reject(err);
        }, {timeout: 7000, maximumAge:0, enableHighAccuracy: false});

        q.reject(err);
      }, {timeout: 4000, maximumAge:0, enableHighAccuracy: true});
    }

    return q.promise();
  },

  getCurrentLocation: function(options) {
    var q = $.Deferred();
    var self = this;
    var timeout = (options.timeout)? options.timeout : 10000;
    var locationTimeout;

    if (navigator.geolocation) {
      locationTimeout = setTimeout(function() {
        q.reject('timeout');
      }, timeout);

      navigator.geolocation.getCurrentPosition(function (result) {
        clearTimeout(locationTimeout);

        var coords = { lat: result.coords.latitude, lon: result.coords.longitude };
        self.saveItem('geolocation', coords);
        q.resolve(coords);
      }, function (err) {
        clearTimeout(locationTimeout);
        q.reject(err);
      }, options);
    }

    return q.promise();
  },

  getItem: function(key) {
    var localItem = localStorage.getItem( key );
    if( localItem ) {
      this.set(key, JSON.parse( localItem ) );
    }
  },

  saveItem: function(key, value) {
    this.set(key, value);
    localStorage.setItem(key, JSON.stringify( value ) );
  },

  geocode: function(address) {
    var q = $.Deferred();
    var geocoder = new google.maps.Geocoder();
    var bounds = this.getSearchBounds();
    var self = this;

    if ( address.toLowerCase() === 'current location' ) {
      
      // Refresh geolocation to get current location.
      this.getCascadeLocation().done(function(result){
        q.resolve([{ lat: result.lat, lon: result.lon, address: 'Current Location' }]);
      }).fail(function(err){
        q.reject(err);
      });

    } else {

      geocoder.geocode({'address': address, 'bounds': bounds, region: 'US'}, function (results, status) {
        if ( status == google.maps.GeocoderStatus.OK ) {
          q.resolve(results);
        } else {
          q.reject('geocode:failure');
        }
      });

    }

    return q.promise();
  },

  getSearchBounds: function(){
    var geolocation = this.get('geolocation');
    if (geolocation) {
      var bounds = Omg.Utils.Geo.computeBoundingCoordinates({radLat:geolocation.lat, radLon:geolocation.lon }, 50);
      var bounds = new google.maps.LatLngBounds(
        new google.maps.LatLng(bounds.minLat,bounds.minLon, true),
        new google.maps.LatLng(bounds.maxLat,bounds.maxLon, true)
      );
      return bounds;
    }
    
    return null;
  },

});