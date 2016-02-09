/*
|----------------------------------------------------------------------------------------------------
| MapView
|----------------------------------------------------------------------------------------------------
*/

Omg.Views.Map = Backbone.Marionette.ItemView.extend({
  template:     JST['_jst/map.html'],
  hud_template: JST['_jst/hud.html'],
  className:    'view-map',

  map:         null,
  map_markers: [],
  stops:       [],
  views:       {},
  infobox:     null,
  ran:         false,
  lat:         0,
  lon:         0,

  events: {
    'click #map-canvas a': 'mapAnchorClicked'
  },

  init: function() {
    if(!this.map) {

      this.stops = [];
      this.views = {};

      _.bindAll(this);

      var mapcenter, polyOptions;

      // this.listenTo(Omg.vent, "map:center", this.centerMap, this);
      // this.listenTo(Omg.vent, "map:pan", this.panMap, this);
      // this.listenTo(Omg.vent, "map:hide_markers_except", this.hideMarkersExcept, this);
      // this.listenTo(Omg.vent, 'location:updated_coordinates', this.changeCoordinates, this);
      // this.listenTo(Omg.vent, "location:update_current_location", this.updateCurrentPosition, this);
      // this.listenTo(Omg.vent, "filters:changed", this.filtersChanged, this);
      // this.listenTo(Omg.vent, "map:select_stop", this.selectStop, this);

      // var nocenter = false;
      // mapcenter = Omg.location.get('geocenter');
      // if(!mapcenter) {
      //   nocenter = true;
      //   mapcenter = AppConfig.default_center;
      // }

      var mapcenter = ( Omg.location.get('current_position') )? Omg.location.get('current_position') : Omg.location.get('geolocation');
      var usingDefaultLocation = false;
      if (!mapcenter) {
        usingDefaultLocation = true;
        mapcenter = AppConfig.default_center;
      }

      var mapStyles = [{ featureType: "poi", elementType: "labels", stylers: [ { visibility: "off" } ]}];
      var zoom = (localStorage.platform && localStorage['platform'].toLowerCase() === 'web')? true : false;
      var map_options = {
        center:             new google.maps.LatLng(mapcenter.lat, mapcenter.lon),
        zoom:               16,
        mapTypeId:          google.maps.MapTypeId.ROADMAP,
        panControl:         false,
        mapTypeControl:     false,
        //Zoom controls should only be visible on the web
        zoomControl:        true,
        zoomControlOptions: { position: google.maps.ControlPosition.LEFT_CENTER },
        streetViewControl:  false,
        styles:             mapStyles
      };
      
      this.map = new google.maps.Map(document.getElementById("map-canvas"), map_options);

      // polyOptions = {
      //   strokeColor: '#2ea1e2',
      //   strokeOpacity: 0.7,
      //   strokeWeight: 4.5
      // };

      this.markers_hidden = false;

      // Set polyline options for map
      // this.poly = new google.maps.Polyline(polyOptions);
      // this.poly.setMap(this.map);

      // Setup directions renderer
      // this.directions_display = new google.maps.DirectionsRenderer({ draggable: false });
      // this.directions_display.setMap(this.map);

      // Set directions display for map
      //this.directions_service = new google.maps.DirectionsService();

      $('div.gmnoprint').first().parent().append(this.mapElement);

      // this.infobox = new google.maps.InfoWindow({
      //   size: new google.maps.Size(400, 70)
      // });

      this.yah_marker = new google.maps.Marker({
        position:  new google.maps.LatLng(mapcenter.lat, mapcenter.lon),
        map:       this.map,
        draggable: false,
        icon: new google.maps.MarkerImage(AppConfig.icons.YOU_ARE_HERE, null, null, new google.maps.Point(15,15), new google.maps.Size(30,30))
      });

      var currentposition = Omg.location.get('geolocation');
      if(currentposition) {
        this.yah_marker.setPosition(new google.maps.LatLng(currentposition.lat, currentposition.lon));
      }

      var middle_marker_image = new google.maps.MarkerImage(
        AppConfig.icons.MIDDLE,
        null, /* size is determined at runtime */
        null, /* origin is 0,0 */
        new google.maps.Point(9, 9), //Anchor point
        new google.maps.Size(19, 19)   //Scale the size to this
      ); 

      
      this.middle_marker = new google.maps.Marker({
        map:  this.map,
        icon: middle_marker_image,
        position:  new google.maps.LatLng(mapcenter.lat, mapcenter.lon),
      });
      this.selected_marker = false;

      var self=this;

      //idle event fires once when the user stops panning/zooming
      google.maps.event.addListener( this.map, "idle", this.map_bounds_changed );
      google.maps.event.addDomListener(window, 'resize', function() {
        self.map.setCenter(self.middle_marker.position);
      });
      google.maps.event.addListener( this.map, "rightclick", this.map_right_click);
      google.maps.event.addListener( this.map, "click", this.mapClicked);

      $('.btn-current-location').on('click', this.retrieveGeolocation );
      this.geolocationAlert = new Omg.Views.GeolocationAlert({ el: this.$el.find('.geolocate-alert') });

      this.spiderfy = new OverlappingMarkerSpiderfier(this.map, {keepSpiderfied:true, nearbyDistance:10});
      
      this.spiderfy.addListener('click', function(marker, event) {
        self.markerClicked(marker);
      });

      if(usingDefaultLocation) {
        this.retrieveGeolocation();
      } else {
        this.centerMap(mapcenter.lat, mapcenter.lon);
      }
    }
  },

  onShow: function() {
    this.addUi();
    this.init();
  },

  selectStop: function(id) {
    var self    = this;

    //Determine whether the stop is in the list of available stops
    var marker  = false;
    var thestop = false;
    for(var i in this.stops){
      if(this.stops[i].id==id){
        thestop = this.stops[i];
        marker  = thestop.marker;
        break;
      }
    }

    if(!marker) return;

    //Reset old marker to have its normal icon back
    if (self.selected_marker){
      self.selected_marker.setOptions({zIndex:1});
      self.selected_marker.setIcon( AppConfig.transit_mode_icons[self.selected_marker.stop_type].gicon );
    }

    //Set this marker to use its hover icon
    self.selected_marker=marker;
    marker.setOptions({zIndex:999});
    marker.setIcon( AppConfig.transit_mode_icons[thestop.stop_type].ghover );

    var view = self.views[thestop.id];

    // Set pin to center of map
    var center = new google.maps.LatLng(thestop.location.lat, thestop.location.lon);
    self.map.panTo(center);
    self.mapPreview.showPreview();
    
    view.update(function() {
      if(!self.mapPreview.$el.hasClass('active'))
        self.mapPreview.setPreview(view, thestop);
      }, false, self.mapPreview.showNetworkError);
  },

  // revive: function() {
  //   //google.maps.event.trigger(this.map, 'resize');
  //   Omg.map_visible = true;
  //   if(this.map) {
  //     this.changeCoordinates();
  //   }
  //   console.log('MapView :: ReRendered');
  // },

  addUi: function() {
    this.mapPreview = new Omg.Views.MapPreview();
    
    $('.btn-current-location').show();
    this.mapPreview.$el.show();
  },

  retrieveGeolocation: function() {
    var self = this;
    this.geolocationAlert.$el.show();

    Omg.location.getCascadeLocation().then(function(coords) {
      self.geolocationAlert.$el.hide();
      self.yah_marker.setPosition(new google.maps.LatLng(coords.lat, coords.lon));
      self.centerMap(coords.lat, coords.lon);
    }).fail(function(err) {
      self.geolocationAlert.error();
    });
  },

  mapClicked: function(e) {
    if ( this.mapPreview.expanded ) {
      this.mapPreview.retract();
      this.showMarkers();
    } else if ( this.mapPreview.preview ) {
      this.mapPreview.hide();
      if (this.selected_marker){
        this.selected_marker.setOptions({zIndex:1});
        this.selected_marker.setIcon( AppConfig.transit_mode_icons[this.selected_marker.stop_type].gicon );
      }
    }
    Omg.vent.trigger('map:clicked');
  },

  mapAnchorClicked: function(e) {
    //e.preventDefault();
  },

  centerMap: function(lat, lon){
    var center = new google.maps.LatLng(lat, lon);
    this.map.panTo(center);
    //this.yah_marker.setPosition(center);
    //google.maps.event.trigger(this.map, 'resize');
  },

  filtersChanged: function() {
    console.log('filters changed');
    this.map_bounds_changed(true);
  },

  // changeCoordinates: function() {
  //   console.log('UPDATED LOCATION :: change Coordinates');
  //   if(Omg.map_visible) {
  //     var position = Omg.location.get('geocenter');
  //     var ypos = Omg.location.get('currentposition');
  //     if(!ypos) {
  //       ypos = position;
  //     }

  //     this.centerMap(position.lat, position.lon);
      
  //     var yah = new google.maps.LatLng(ypos.lat, ypos.lon);  
  //     this.yah_marker.setPosition(yah);
      
  //   }
  // },

  panMap: function(lat, lon){
    var self=this;
    var center = new google.maps.LatLng(lat, lon);
    self.map.panTo(center);
  },

  hover_on_marker: function(stopid) { //TODO: Dead code
    var view = this.views[stopid], self = this;

    if(view.$el.html().length !== 0)
      self.mapElement.html(view.$el.html());
    else
      self.mapElement.html('<span class="label route-chip" style="background-color:black">No Data</span>');
  },

  addStop: function(new_stop, index) {
    var stop_type = new_stop.stop_type;
    var icon      = AppConfig.transit_mode_icons[stop_type];
    var self      = this;

    //Ignore stop types I do not recognise
    if(typeof(icon)==='undefined'){
      console.error('Unrecognised transit type: ',stop_type)
      return;
    }

    //Search stops array to see if an object for this stop is already present
    var look_up=false;
    for(var i in this.stops){
      if( this.stops[i].id == new_stop.id ){
        look_up=i;
        break;
      }
    }
    
    //Does a marker for this stop already exist on the map?
    if(look_up!==false) {
      return; //Yes, it already has a marker. Don't make another!
    }

    //Do we know this kind of marker?
    if(!KnownTransitType(stop_type)) {
      return;
    }

    //Make a new marker
    var marker = new google.maps.Marker({
      position:    new google.maps.LatLng(new_stop.location.lat,new_stop.location.lon),
      map:         this.map,
      draggable:   false,
      icon:        icon.gicon,
      //animation: google.maps.Animation.DROP,
      stopid:      new_stop.id,
      zIndex:      1,
      stop_type:   stop_type,
      visible:     !self.markers_hidden,
      optimized: false
    });

    marker.stop=new_stop;

    // if(this.markerCluster) {
    //   this.markerCluster.addMarker(marker);
    // }

    if(this.spiderfy) {
      this.spiderfy.addMarker(marker);  
    }

    if (!this.views[new_stop.id]) {
      this.views[new_stop.id] = new Omg.Views.Realtime({ stop: new_stop, map_stop:true });
    }

    //if(look_up) //Already present in stops array
    //  this.stops[look_up].marker = marker;
    //else {  //The stop is not in the array, so add it
      new_stop.marker = marker;
      this.stops.push(new_stop);
    //}
  },

  markerClicked: function(marker) {
    var self = this;
    var icon = AppConfig.transit_mode_icons[marker.stop.stop_type];

    //Reset old marker to have its normal icon back
    if (this.selected_marker){
      this.selected_marker.setOptions({zIndex:1});
      this.selected_marker.setIcon( AppConfig.transit_mode_icons[this.selected_marker.stop_type].gicon );
    }

    //Set this marker to use its hover icon
    this.selected_marker=marker;
    marker.setOptions({zIndex:999});
    marker.setIcon( icon.ghover );

    var view = this.views[marker.stop.id];
    var preview_page = 'Preview Page: '+ marker.stop.stop_url.replace(/\/.*/,'').toLowerCase() + ': '+ marker.stop.stop_name;
    logEvent(preview_page, 'pageview', '/virtual/preview/'+marker.stop.stop_url.toLowerCase());

    // Set pin to center of map
    var center = new google.maps.LatLng(marker.stop.location.lat, marker.stop.location.lon);
    this.map.panTo(center);
    this.mapPreview.showPreview();
    
    view.update(function() {
      if(!self.mapPreview.$el.hasClass('active'))
        self.mapPreview.setPreview(view, marker.stop);
    }, false, self.mapPreview.showNetworkError);

    this.selectStop(marker.stop.id);
  },

  get_closest_trip: function(stop_id, route_id) {
    var self = this;
    $.get('/stop/closest_trip', {stop_id: stop_id, route: route_id }, function(data, textStatus, jqXHR) {
      if(data) {
        self.set_path(data.encoded_polyline);
      }
    });
  },

  set_path: function(path) {
    var decodedSets = google.maps.geometry.encoding.decodePath(path); 
    this.poly.setPath(decodedSets);
    this.poly.setMap(this.map);
  },

  clear_path: function() {
    this.poly.setMap(null);
  },

  //TODO(Richard): There are multiple uses of the variable path below. This
  //needs to be sorted out.
  add_path: function(path) {
    var decodedSets = google.maps.geometry.encoding.decodePath(path);
    var path = this.poly.getPath();
    path.push(decodedSets);
  },

  map_right_click: function(event) {
    var lat = event.latLng.lat();
    var lon = event.latLng.lng();
    Omg.location.updatePosition(lat,lon);
  },

  hideMarkers: function() {
    this.markers_hidden = true;
    _.each(this.stops, function(stop, index) {
      stop.marker.setVisible(false);
    });
  },

  showMarkers: function() {
    var self=this;
    this.markers_hidden = false;
    _.each(this.stops, function(stop, index) {
      stop.marker.setVisible(true);
    });
  },

  hideMarkersExcept: function(stop) {
    this.hideMarkers();
    //TODO(Richard): The stops objects the map references should, ideally be the
    //same stops objects everyone else references. There should be one universal
    //place which stores, retrieves, &c. stop information
    for(var i in this.stops){
      if(this.stops[i].id==stop.id){
        this.stops[i].marker.setVisible(true);
        return;
      }
    }
  },

  map_bounds_changed: function(clear) {

    var bounds  = this.map.getBounds();
    var mcenter = this.map.getCenter();

    var ne        = bounds.getNorthEast();
    var sw        = bounds.getSouthWest();
    var boundsobj = {n:ne.lat(),s:sw.lat(),e:ne.lng(),w:sw.lng(), centerLat: mcenter.lat(), centerLng: mcenter.lng(), filter: Omg.filters.formatted };
    var self      = this;

    //Clear all the stop markers which are not currently visible and currently not in the table.
    //TODO(Richard): Does this still work if the stops array size is changing when we delete markers?
    this.middle_marker.setPosition(mcenter);

    _.each(this.stops, function(stop, index) {

      if( ( stop && typeof(stop.marker) !== 'undefined' && !bounds.contains(stop.marker.getPosition()) && !stop.in_table ) || clear ){
        google.maps.event.clearInstanceListeners(stop.marker);
        self.spiderfy.removeMarker(stop.marker);
        stop.marker.setMap(null);

        delete self.stops[index].marker;
        delete self.stops[index];
      }
    });

    //Clear stops from the list which are not visible and not in the table
    //this.stops = _.filter(this.stops, function(stop) { return stop.in_table || typeof(stop.marker)!=='undefined'; });

    //Get locations of stops which are visible
    $.get(AppConfig.realtimeUrl + '/bounds', boundsobj, function(data, textStatus, jqXHR) {
      
      for(var j=0, len=data.stops.length; j<len; j++) {
        self.addStop(data.stops[j], j);
      }

    });

    Omg.location.saveItem('current_position', { lat: mcenter.lat(), lon: mcenter.lng() });
  },

  close: function() {},
  onClose: function() {
    // custom cleanup or closing code, here
    console.log('closing :: Omg.Views.Map');
    this.mapPreview.$el.hide();
    this.mapPreview.hide();
    $('.btn-current-location').off('click', this.retrieveGeolocation );
    $('.btn-current-location').hide();
  }

});