var AppConfig = {
  environment: 'local',
  default_center: {lat:44.980522382993826, lon:-93.27006340026855},

  transit_mode_icons: {
    small: {
      normal: {
        path:          google.maps.SymbolPath.CIRCLE,
        fillOpacity:   0.8,
        fillColor:     'ff0000',
        strokeOpacity: 1.0,
        strokeColor:   'fff',
        strokeWeight:  3.0,
        scale:         6 //pixels
      },
      hover: {
        path:          google.maps.SymbolPath.CIRCLE,
        fillOpacity:   0.8,
        fillColor:     'FFC200',
        strokeOpacity: 1.0,
        strokeColor:   'fff',
        strokeWeight:  3.0,
        scale:         6 //pixels
      }
    },
    metro_bus: {
      icon:     'assets/images/pin-bus.png',
      hover:    'assets/images/pin-bus-hover.png',
      gicon:    new google.maps.MarkerImage('assets/images/pin-bus.png', null, null, new google.maps.Point(12,39), new google.maps.Size(24,39)),
      ghover:   new google.maps.MarkerImage('assets/images/pin-bus-hover.png', null, null, new google.maps.Point(12,39), new google.maps.Size(24,39)),
      texticon: 'transit'
    },
    bikeshare_station: {
      icon:     'assets/images/pin-bikestation.png',
      hover:    'assets/images/pin-bikestation-hover.png',
      gicon:    new google.maps.MarkerImage('assets/images/pin-bikestation.png', null, null, new google.maps.Point(12,39), new google.maps.Size(24,39)),
      ghover:   new google.maps.MarkerImage('assets/images/pin-bikestation-hover.png', null, null, new google.maps.Point(12,39), new google.maps.Size(24,39)),
      texticon: 'bike'
    },
    car2go: {
      icon:     'assets/images/pin-car.png',
      hover:    'assets/images/pin-car-hover.png',
      gicon:    new google.maps.MarkerImage('assets/images/pin-car2go.png', null, null, new google.maps.Point(12,39), new google.maps.Size(24,39)),
      ghover:   new google.maps.MarkerImage('assets/images/pin-car2go-hover.png', null, null, new google.maps.Point(12,39), new google.maps.Size(24,39)),
      texticon: 'driving'
    },
    intercity_train: {
      icon:     'assets/images/pin-train.png',
      hover:    'assets/images/pin-train-hover.png',
      gicon:    new google.maps.MarkerImage('assets/images/pin-train.png', null, null, new google.maps.Point(12,39), new google.maps.Size(24,39)),
      ghover:   new google.maps.MarkerImage('assets/images/pin-train-hover.png', null, null, new google.maps.Point(12,39), new google.maps.Size(24,39)),
      texticon: 'transit' //TODO: Need to find a train icon for sprite-1x.png
    },
    airport: {
      icon:     'assets/images/pin-airport.png',
      hover:    'assets/images/pin-airport-hover.png',
      gicon:    new google.maps.MarkerImage('assets/images/pin-airport.png', null, null, new google.maps.Point(12,39), new google.maps.Size(24,39)),
      ghover:   new google.maps.MarkerImage('assets/images/pin-airport-hover.png', null, null, new google.maps.Point(12,39), new google.maps.Size(24,39)),
      texticon: 'plane'
    },
    zipcar: {
      icon:     'assets/images/pin-carstation.png',
      hover:    'assets/images/pin-carstation-hover.png',
      gicon:    new google.maps.MarkerImage('assets/images/pin-zipcar.png', null, null, new google.maps.Point(12,39), new google.maps.Size(24,39)),
      ghover:   new google.maps.MarkerImage('assets/images/pin-zipcar-hover.png', null, null, new google.maps.Point(12,39), new google.maps.Size(24,39)),
      texticon: 'driving'
    },
    metro_train: {
      icon:     'assets/images/pin-train.png',
      hover:    'assets/images/pin-train-hover.png',
      gicon:    new google.maps.MarkerImage('assets/images/pin-train.png', null, null, new google.maps.Point(12,39), new google.maps.Size(24,39)),
      ghover:   new google.maps.MarkerImage('assets/images/pin-train-hover.png', null, null, new google.maps.Point(12,39), new google.maps.Size(24,39)),
      texticon: 'transit' //TODO: Need to find a train icon for sprite-1x.png
    },
    bikeshare_free: {
      icon:     'assets/images/pin-bike.png',
      hover:    'assets/images/pin-bike-hover.png',
      gicon:    new google.maps.MarkerImage('assets/images/pin-bike.png', null, null, new google.maps.Point(12,39), new google.maps.Size(24,39)),
      ghover:   new google.maps.MarkerImage('assets/images/pin-bike-hover.png', null, null, new google.maps.Point(12,39), new google.maps.Size(24,39)),
      texticon: 'bike'
    },
    hourcar: {
      icon:     'assets/images/pin-hourcar.png',
      hover:    'assets/images/pin-hourcar-hover.png',
      gicon:    new google.maps.MarkerImage('assets/images/pin-hourcar.png', null, null, new google.maps.Point(12,39), new google.maps.Size(24,39)),
      ghover:   new google.maps.MarkerImage('assets/images/pin-hourcar-hover.png', null, null, new google.maps.Point(12,39), new google.maps.Size(24,39)),
      texticon: 'driving'
    }
  },

  filters: [
    {
      name: 'Bus',
      icon: 'transit',
      types: [1,7]
    },
    {
      name: 'Car Share',
      icon: 'driving',
      types: [3,6]
    },
    {
      name: 'Bike Share',
      icon: 'bike',
      types: [2]
    },
    {
      name: 'Train',
      icon: 'transit',
      types: [4]
    }
  ],

  tracking_modes: [
    {
      label: 'Bus',
      key: 'bus',
      mode: 'transit',
      category: 'transit'
    },
    {
      label: 'Rail',
      key: 'rail',
      mode: 'transit',
      category: 'transit'
    },
    {
      label: 'Bike',
      key: 'bike',
      mode: 'biking',
      category: 'biking'
    },
    {
      label: 'Car',
      key: 'personal_car',
      mode: 'driving',
      category: 'driving'
    },
    {
      label: 'Walk',
      key: 'walk',
      mode: 'walking',
      category: 'walking'
    },
    {
      label: 'Bikeshare',
      key: 'bikeshare',
      mode: 'bikeshare',
      category: 'bikeshare'
    },
    {
      label: 'Car2go',
      key: 'car2go',
      mode: 'driving',
      category: 'carshare'
    },
    {
      label: 'Zipcar',
      key: 'zipcar',
      mode: 'driving',
      category: 'carshare'
    },
    {
      label: 'Hourcar',
      key: 'hourcar',
      mode: 'driving',
      category: 'carshare'
    },
    {
      label: 'Uber',
      key: 'uber',
      mode: 'riding',
      category: 'rideshare'
    },
    {
      label: 'Lyft',
      key: 'lyft',
      mode: 'riding',
      category: 'rideshare'
    },
    {
      label: 'Sidecar',
      key: 'sidecar',
      mode: 'riding',
      category: 'rideshare'
    },
    {
      label: 'Hailo',
      key: 'hailo',
      mode: 'riding',
      category: 'rideshare'
    }
  ],

  icons: {
    YOU_ARE_HERE: 'assets/images/you-are-here.svg',
    MIDDLE:       'assets/images/crosshair.svg'
  },
  csrfToken: $("meta[name='csrf-token']").attr('content')
}

if( document.location.protocol === "file:") {
  // App URL
  AppConfig.backendUrl  = 'https://omgtransit.com';
} else if ( window.location.host === 'app.omgtransit.it' ) {
  // Local Dev
  AppConfig.backendUrl  = 'http://omgtransit.it';
} else {
  // Normal web
  AppConfig.backendUrl  = 'https://'+window.location.host;
}

AppConfig.realtimeUrl = AppConfig.backendUrl + '/v0';
