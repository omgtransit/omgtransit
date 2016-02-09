/*
|----------------------------------------------------------------------------------------------------
| LocationModel
|----------------------------------------------------------------------------------------------------
*/

Omg.Models.Location = Backbone.Model.extend({
  defaults: {
    geocenter: null,
    cached_addresses: []
  },

  initialize: function() {
    //If we have a geocenter cached in local storage, grab it out on load.
    //That is: we assume the app starts in the same location it stopped.
    //This saves us from having to do a geolocation on load.
    var geocenter = $.cookie("geocenter");
    if (typeof(geocenter) !== "undefined") {
      this.set('geocenter', JSON.parse(geocenter));
    }

    var currentposition = $.cookie("currentposition");
    if (typeof(currentposition) !== "undefined") {
      this.set('currentposition', JSON.parse(currentposition));
    } else if (typeof(geocenter) !== "undefined") {
      this.set('currentposition', JSON.parse(geocenter));
      $.cookie("currentposition", JSON.stringify(geocenter));
    }

    //Load the LRU address cache, if there is one. Elsewise, start a new one.
    this.cached_addresses = $.cookie('cached_addresses');
    if(typeof(this.cached_addresses)==='undefined')
      this.cached_addresses = [];
    else
      this.cached_addresses = JSON.parse(this.cached_addresses);



    this.listenTo(Omg.vent, 'location:geocode_address_and_center_on_it', this.centerOnAddress, this);
    this.listenTo(Omg.vent, 'location:center_on_lat_lon', this.centerOnLatLon, this);

    //Notes when a cached address is chosen and manages the LRU address cache
    //accordingly
    this.listenTo(Omg.vent, 'location:chose_cached', this.choseCachedAddress, this);
  },

  //Returns a promise which resolves to an object with **lat** and **lon**
  //properties.
  getGeolocation: function(){
    this.deferred = $.Deferred();
    var self = this;

    if (navigator.geolocation) {

      // If after 14 sec we have not found geolocation, stop looking.
      if(!this.location_timeout) {
        this.location_timeout = setTimeout(function() {
          self.geoFail();
        }, 14000);
      }

      // Geolocation: High Accuracy
      navigator.geolocation.getCurrentPosition(function(pos) {
        logEvent('Request Success', 'event', 'Geolocation', 'High Accuracy');
        self.geoSuccess(pos);
      }, function(error) {
        console.log(error);
        logEvent('Request Failed', 'event', 'Geolocation', 'High Accuracy');
        self.lowAccuracy(error);
      }, {
        timeout: 4000,
        maximumAge: 0,
        enableHighAccuracy: true
      });

    } else {
      self.geoFail();
      this.deferred.reject("location:geocode:failure");
      return false;
    }

    return this.deferred.promise();
  },

  resetTimeout: function() {
    clearTimeout(this.location_timeout);
    delete this.location_timeout;
  },

  geoSuccess: function(pos) {
    this.resetTimeout();
    logEvent('coordinates', 'event', 'location', pos.coords.latitude.toString() + "," + pos.coords.longitude.toString());
    this.deferred.resolve({lat:pos.coords.latitude, lon:pos.coords.longitude});
    Omg.vent.trigger('message:donethinking');
    $('.btn-current-location').removeClass('btn-location-active');
  },

  lowAccuracy: function() {
    var self = this;
    
    // Geolocation: Low Accuracy
    navigator.geolocation.getCurrentPosition(
      function(pos) {
        logEvent('Request Success', 'event', 'Geolocation', 'Low Accuracy');
        self.geoSuccess(pos);
      }, 
      function (error) {
        logEvent('Request Failed', 'event', 'Geolocation', 'Low Accuracy');
        self.errorLowAccuracy(error);
      },
      {
        timeout: 8000,
        maximumAge: 0,
        enableHighAccuracy: false
      }
    );

  },

  errorLowAccuracy: function(error) {
    this.resetTimeout();
    var msg = "Can't get your location (low accuracy attempt). Error = ";
    
    if (error) {
      if (error.code == 1)
        msg += "PERMISSION_DENIED";
      else if (error.code == 2)
        msg += "POSITION_UNAVAILABLE";
      else if (error.code == 3)
        msg += "TIMEOUT";
      msg += ", msg = "+error.message;
    }

    console.log(msg);

    this.geoFail();
  },

  geoFail: function() {
    var userMessage = "Unable to get location. Please share your location and enable High Accuracy mode. <br>Putting you in Minneapolis to demonstrate how I work.";
    Omg.vent.trigger('message:error', userMessage, 7);
    Omg.vent.trigger('message:donethinking');

    // Here we are going to send them to MSP to get started.
    this.setCenter(44.983334, -93.26666999999999);
    this.broadcastCurrentLocation();
    $('.btn-current-location').removeClass('btn-location-active');
  },

  geolocateAndRecenter: function(){
    var self=this;
    this.getGeolocation().done(function(loc){
      self.setCenter(loc.lat, loc.lon, true);
      self.broadcastCurrentLocation();
    });
  },

  centerOnLatLon: function(lat, lon){
    this.setCenter(lat,lon);
    this.broadcastCurrentLocation();
  },

  //Broadcasts an event indicating the current geocenter
  broadcastCurrentLocation: function() {
    Omg.vent.trigger("location:updated_coordinates", this.get('geocenter'));
  },

  //Sets the current center to (lat,lon)
  setCenter: function(lat, lon, current) {
    
    var geocenter = { 
      lat: lat,
      lon: lon
    };

    this.set('geocenter', geocenter);
    $.cookie("geocenter", JSON.stringify(geocenter));

    if(current) {
      this.set('currentposition', geocenter);
      $.cookie("currentposition", JSON.stringify(geocenter));
    }
  },

  isAddressRouteNumber: function(address){
    return address.match(/^\s*\d{1,3}\s*\w?\s*$/);
  },

  isAddressBlank: function(address){
    return address.match(/^\s*$/);
  },

  isValidAddress: function(address){
    return (!this.isAddressRouteNumber(address) && !this.isAddressBlank(address));
  },

  getSearchBounds: function(){
    var center = this.get('geocenter');
    if (center) {
      var bounds = Omg.Utils.Geo.computeBoundingCoordinates({radLat:center.lat, radLon:center.lon }, 50);
      var bounds = new google.maps.LatLngBounds(
        new google.maps.LatLng(bounds.minLat,bounds.minLon, true),
        new google.maps.LatLng(bounds.maxLat,bounds.maxLon, true)
      );
      return bounds;
    }
    
    return null;
  },

  centerOnAddress: function(address, callback) {
    var self=this;
    console.log('Processing Address Search :: ', address);
    //ga('send', {'hitType': 'pageview', 'page': '/virtual/address_search.php?q='+encodeURI(address)});
    
    if(this.isAddressRouteNumber(address)) {
      Omg.vent.trigger('message:error',"Sorry! We don't support route searching yet, please enter an address.");
      return;
    }

    Omg.vent.trigger('message:thinking');

    if(this.isAddressBlank(address)){
      this.getCurrentPosition().done(function(){
        Omg.vent.trigger('message:donethinking');
      }).fail(function(){
        Omg.vent.trigger('message:donethinking');
        Omg.vent.trigger('message:error',"Couldn't get current location.");
      })
      return;
    }

    var bounds=this.getSearchBounds();

    this.geocode(address, bounds).done(function(loc) {
      self.setCenter(loc.lat,loc.lon);
      self.broadcastCurrentLocation();
      Omg.router.redirectSearchToMap();
      Omg.hud.hide();
      Omg.vent.trigger('message:donethinking');
    }).fail(function(err){
      Omg.vent.trigger('message:donethinking');
      Omg.vent.trigger('message:error','Could not geocode that address!');
    });
  },


  //Returns a promise which resolves to an object with **address**, **lat**,
  //and **lon** properties representing the geolocation of the specified address.
  //The search is biased towards **bounds**.
  convertAddressToGeolocation: function(address){
    if(!this.isValidAddress(address)){
      var deferred = $.Deferred();
      deferred.reject('Not a valid address!');
      return deferred.promise();
    } else {
      var bounds=this.getSearchBounds();
      return this.geocode(address, bounds);
    }
  },

  //Takes any address (string) such as "1843 mountain ave" or "1843 Mountain Ave
  //W" along with that address's location and that info to the front of the LRU
  //address cache.
  cacheAddressAndLocation: function(address, lat, lon){
    var key       = address.toLowerCase();
    var new_entry = [{lat:lat, lon:lon, address:address}]
    this.cached_addresses = new_entry.concat(this.cached_addresses);
    //Truncate the array to have at most 8 elements
    if(this.cached_addresses.length>8)
      this.cached_addresses.length = 8;
    this.saveLRUAddressCache();
  },

  //Accepts an address and puts this at the top of front of the addresses LRU
  //cache. The address must already be present in the cache or the function will
  //exit silently.
  choseCachedAddress: function(address){
    //Find the address if it is in the LRU
    var i;
    for(i=0;i<this.cached_addresses.length;i++)
      if(this.cached_addresses[i].address==address)
        break;

    //Quit if the element is not in the LRU
    if(i==this.cached_addresses.length)
      return;

    //Copy the existing element into a new array
    var to_top = [this.cached_addresses[i]];
    //Remove the element from its place in the array
    this.cached_addresses.splice(i,1);

    //Merge the old LRU into the new array, thereby placing the chosen element
    //at the front
    this.cached_addresses=to_top.concat(this.cached_addresses);

    //Truncate the array to have at most 8 elements
    if(this.cached_addresses.length>8)
      this.cached_addresses.length = 8;

    this.saveLRUAddressCache();
  },

  //Takes an address (string) such as "1843 mountain ave" or "1843 Mountain Ave W"
  //and returns an object with lat, lon, and address properties or a false
  //(boolean) if the address is not cached 
  getCachedAddressLocation: function(address){
    var key=address.toLowerCase();
    for(var i in this.cached_addresses)
      if(this.cached_addresses[i].address==address)
        return this.cached_addresses[i];
    return false;
  },

  saveLRUAddressCache: function(){
    $.cookie('cached_addresses', JSON.stringify(this.cached_addresses));
  },

  //HELPER FUNCTION!
  //Returns a promise which resolves to an object with **address**, **lat**, and **lon**
  //properties representing the geolocation of the specified address. The search
  //is biased towards **bounds**.
  geocode: function(address, bounds) {
    var deferred = $.Deferred();
    var geocoder = new google.maps.Geocoder();
    var self     = this;

    //TODO(Richard): Since the address is biased towards a particular bounds
    //caching results of a user who travels to a different city is dangerous!
    //TODO(Richard): Should probably do some kind of fuzzy matching here or add
    //addresses to dropdowns in the relevant places.
    var cached=this.getCachedAddressLocation(address);
    if(cached){
      deferred.resolve(cached);
      return deferred;
    }

    
    if ( address.toLowerCase() === 'current location' ) {
      
      // If the user entered current location,
      // let's use the current geocenter.
      self.getGeolocation().done(function(loc){
        deferred.resolve({lat:loc.lat,lon:loc.lon,address:'Current Location'});
      }).fail(function(err){
        deferred.reject(err);
      })

    } else {
      // Else, actually do a geocode.
      // TODO(Richard): Be careful about limiting this to the U.S.!
      geocoder.geocode({'address': address, 'bounds': bounds, region: 'US'}, function (results, status) {

        if (status == google.maps.GeocoderStatus.OK){
          
          if(results.length == 1) { 
            var lat=results[0].geometry.location.lat();
            var lon=results[0].geometry.location.lng();
            self.cacheAddressAndLocation(results[0].formatted_address, lat, lon);
            deferred.resolve({address:results[0].formatted_address, lat: lat, lon: lon});
          } else { //By not caching the address in situations of ambiguity we prevent ourselves from locking the user into a bad choice if they click a wrong button
            Omg.vent.trigger("location:geocode:ambiguity", results, deferred);
            Omg.vent.trigger('message:donethinking');
            //Multiple results, prompt user to choose
          }
        } else {
          //No results, indicate failure
          Omg.vent.trigger("location:geocode:failure");
          deferred.reject();
        }
      });
    }

    return deferred.promise();
  },

  reverseGeocode: function(lat, lon) {
    var deferred = $.Deferred();
    var geocoder = new google.maps.Geocoder();

    geocoder.geocode({'latLng': new google.maps.LatLng(lat, lon)}, function(results, status) {
      if(status == google.maps.GeocoderStatus.OK) {
        if(results[1]) {
          deferred.resolve(results[1].formatted_address);
        }
      } else {
        deferred.reject(status);
      }
    });


    return deferred.promise();
  }
});