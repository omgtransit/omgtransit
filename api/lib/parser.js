var moment  = require('moment-timezone');
var Q       = require('q');
var _       = require('lodash');
var request = require('request');
var utility = require('../lib/utility');

//Include Underscore.string library
_.str = require('underscore.string');
_.mixin(_.str.exports());




String.prototype.capitalizeFirst = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

//Get model information for ZipCars so we can add it to their real-time info
var ZipCarModels = {};

function LoadZipCarModels(){
  var url='http://www.zipcar.com/api/drupal/1.0/vehicle-models?locale=en-US';
  request({ url: url, timeout: 2000 }, function (error, response, body) {
    if(error || response.statusCode!=200){
      console.error('Error fetching ZipCar models!');
      return;
    }

    body=JSON.parse(body);

    if(body.success!==true){
      console.error('Error fetching ZipCar models!',body);
      return;
    }

    _.each(body.vehicleModels, function(model) {
      var obj={
        seatbelts: model.seatbelts,
        brand:     model.makeDescription,
        make:      model.modelDescription,
        type:      model.primaryStyle,
        capacity:  model.goodToKnow.capitalizeFirst(),
      };
      ZipCarModels[model.modelId]=obj;
    });
  });
}

LoadZipCarModels();
























var Parsers = {
  utils: {
    parseQueryString: function( url ) {
      var parser = document.createElement('a');
      parser.href = url;
      
      var params = {}, queries, temp, i, l;
   
      // Split into key/value pairs
      queries = parser.search.replace('?','').split("&");
   
      // Convert the array of strings into an object
      for ( i = 0, l = queries.length; i < l; i++ ) {
        temp = queries[i].split('=');
        params[temp[0]] = temp[1];
      }
   
      return params;
    }
    // convertToEpoch: function() {
    //   var seconds = departure_time.substr(6,10);
    //   var offset = departure_time.substr(19,3);
    //   var arrtime = moment(seconds, "X");
    // }
  }
};

Parsers.stop_bulk_format = function(content){
  var stops = [];
  var raw_stops = content;

  //TODO(Richard): Add distances

  for(var i = 0, len = raw_stops.length; i < len; i++) {
    var raw  = raw_stops[i];
    stops.push(Parsers.stop_format(raw));
  }

  var data = {
    nearby_stops: true,
    stops:        stops
  };

  return data; 
};




var translate_types={
  1: 'metro_bus',
  2: 'bikeshare_station',
  3: 'car2go',
  4: 'intercity_train',
  5: 'airport',
  6: 'zipcar',
  7: 'metro_train',
  8: 'bikeshare_free',
  9: 'hourcar'
};

Parsers.stop_format = function(raw_stop) {
  var stop = raw_stop;

  if (raw_stop.obj) {
    stop = raw_stop.obj
  }

  stop.location = {lat:stop.location[0], lon:stop.location[1]};
  stop.id       = stop.combined_id;
  delete stop.combined_id;
  delete stop._id;
  if(typeof(stop.stop_type)==='undefined'){
    console.error('Error: Unknown stop type translation in Parsers.stop_format');
    stop.stop_type = 'unknown';
  } else {
    stop.stop_type = translate_types[stop.stop_type]
  }

  if(typeof(raw_stop.dis)!=='undefined')
    stop.distance = raw_stop.dis; //Distance in miles to the stop. NOTE: This should change units if we change how we do geo_filtering

  return stop;
};

/*
|----------------------------------------------------------------------------------------------------
| NexTrip API
| Cities: Minneapolis
| Format: json
| Description: http://www.datafinder.org/metadata/NexTripAPI.html
|              https://github.com/r-barnes/mspbus/blob/master/doc/API-INFO.md
|----------------------------------------------------------------------------------------------------
*/

Parsers.nextrip = function(content) {
  
  var obj = [];
  var route_sub={'Blue':'901'};
  var direction_translate={'NORTHBOUND':'north', 'SOUTHBOUND':'south', 'EASTBOUND':'east', 'WESTBOUND':'west'};

  for(var i = 0, len = content.length; i < len; i++) {
    var route_number = content[i].Route;
    if( route_sub[route_number] ) {
      route_number = route_sub[route_number];
    }

    obj.push({
      time:        moment(content[i].DepartureTime).unix(),
      direction:   direction_translate[content[i].RouteDirection],
      route:       content[i].Route + content[i].Terminal,
      description: content[i].Description,
      actual:      content[i].Actual,
      departure:   true,
      updated:     moment().unix()
    });
  }

  //TODO(Richard): Do this at one level higher in the abstraction.
  obj.sort(function(a,b){return a.time-b.time;});

  return obj;
};

/*
|----------------------------------------------------------------------------------------------------
| Clever API
| Cities: Chicago
| Format: json
| Specification: http://www.transitchicago.com/assets/1/developer_center/BusTime_Developer_API_Guide.pdf
|----------------------------------------------------------------------------------------------------
*/
//TODO: Add route description

Parsers.clever = function(content) {
  content = content['bustime-response'];
  if(typeof(content.error)!=='undefined' || typeof(content.prd)==='undefined'){
    console.error('Error parsing Clever response: ',content.error);
    return []; //TODO(Richard): Specifiy some kind of error return for the API
  }

  var obj = [];

  var direction_translate = {Eastbound:'east',Southbound:'south',Northbound:'north',Westbound:'west'};

  _.each(content.prd,function(item){
    var departure = (item.typ[0]=='D');

    var direction = item.rtdir[0];
    if(direction_translate[direction])
      direction = direction_translate[direction];
    else
      console.error('Unrecognised Clever API direction: ',direction);

    var updated_time = moment(item.tmstmp[0],'YYYYMMDD HH:mm');
    updated_time     = utility.toMomentInTimezone(updated_time,'America/Chicago');

    var predicted_time = moment(item.prdtm[0],'YYYYMMDD HH:mm');
    predicted_time     = utility.toMomentInTimezone(predicted_time,'America/Chicago');

    obj.push({
      time:        predicted_time.unix(),
      direction:   direction,
      route:       item.rt[0],
      description: 'Going to ' + item.des[0],
      actual:      true,
      departure:   departure,
      updated:     updated_time.unix()
    });
  });

  return obj;
};


/*
|----------------------------------------------------------------------------------------------------
| CTA Train Tracker API
| Cities: Chicago
| Format: json
| Specification: http://www.transitchicago.com/developers/ttdocs/default.aspx
|----------------------------------------------------------------------------------------------------
*/
Parsers.clevertrain = function(content) {
  content = content.ctatt;

  if(content.errCd[0]!='0'){
    console.error('Warning: A CleverTrain API call error: ', content.errCd[0], content.errNm[0]);
    return false;
  }

  var eta_list = [];

  var direction_translate={'1':'north', '5':'south'};

  _.each(content.eta, function(eta){

    var updated = eta.prdt[0];
    updated = moment(updated,'YYYYMMDD HH:mm:ss');
    updated = utility.toMomentInTimezone(updated,'America/Chicago').unix();

    var estimate;
    if(eta.isApp[0]=='1')
      estimate=moment().unix();
    else {
      estimate = eta.arrT[0];
      estimate = moment(estimate,'YYYYMMDD HH:mm:ss');
      estimate = utility.toMomentInTimezone(estimate,'America/Chicago').unix();
    }

    var actual=true;
    if(eta.isSch[0]=='1')
      actual = false;

    var direction=eta.trDr[0];
    if(typeof(direction_translate[direction])==='undefined'){
      console.error('Warning: Unrecognised CleverTrain direction: ', direction);
    } else {
      direction = direction_translate[direction];
    }

    var datum = {
      time:           estimate,
      direction:      direction,
      route:          eta.rt[0],
      description:    eta.stpDe[0].replace(/\\/g,''),
      actual:         actual,
      departure:      false,
      updated:        updated,
      platform:       false
    };

    eta_list.push(datum);
  });

  eta_list.sort(function(a,b){return a.time-b.time;});

  return eta_list;
};

/*
|----------------------------------------------------------------------------------------------------
| Trimet API
| Cities: Portland
| Format: json
| Multiple: true
| Desc:  http://developer.trimet.org/ws_docs/stop_location_ws.shtml
| Desc2: http://developer.trimet.org/ws_docs/arrivals_ws.shtml
|----------------------------------------------------------------------------------------------------
*/
//TODO: Add route description

Parsers.trimet = function(content) {
  var obj = [],
      arrivals = content.resultSet.arrival;

  if (!arrivals)
    return [];

  _.each(arrivals, function(arrival) {
    var route_sub    = {90:'Red',100:'Blue',190:'Yellow',200:'Green'};
    
    if (arrival.departed)
      return;
    if (arrival.status=="canceled")
      return;

    //TODO (from Richard): Also need to handle delayed and canceled
    var arrival_time;
    var actual;
    if( arrival.estimated ){
      arrival_time = arrival.estimated;
      actual       = true;
    } else {
      arrival_time = arrival.scheduled;
      actual       = false;
    }

    if(arrival_time.trim().length===0)
      return;

    var updated_time=moment().unix();
    if(arrival.blockPosition)
      updated_time=moment(arrival.blockPosition.at).unix();

    var route_number = arrival.route;

    if(route_sub[arrival.route])
      arrival.route=route_sub[arrival.route];

    var dir_sub = {0:'outbound',1:'inbound','yes':'outinbound'}; //0 is OUTBOUND, 1 is INBOUND, 'yes' is BOTH
    var dir     = dir_sub[arrival.dir];

    arrival_time  = moment(arrival_time).unix();

    obj.push({
      time:        arrival_time,
      direction:   dir,
      route:       route_number,
      description: arrival.fullSign,
      actual:      actual,
      departure:   true,
      updated:     updated_time
    });
  });

  return obj;
};

/*
|----------------------------------------------------------------------------------------------------
| WMATA API
| Cities: Washington DC
| Format: json
| Specification: http://developer.wmata.com/io-docs
| Specification Details: http://developer.wmata.com/docs/read/GetBusPrediction
|----------------------------------------------------------------------------------------------------
*/
//TODO: Add route description

Parsers.wmata_bus = function(content) {
  var obj = [];
  var arrivals = content.Predictions;

  var direction_translate = {0:'inbound', 1:'outbound'}; //TODO(Richard): Confirm that these are correct with WMATA people.

  var current_time = moment().unix();

  _.each(arrivals,function(item){
    var direction = item.DirectionNum;
    if(typeof(direction_translate[direction])!=='undefined')
      direction=direction_translate[direction];
    else
      console.error('Unrecognised WMATA (Washington DC) route direction: '+direction);

    var secs_until_arrival = 60*item.Minutes;

    obj.push({
      time:        current_time+secs_until_arrival,
      direction:   direction,
      route:       item.RouteID,
      description: item.DirectionText,
      actual:      true,
      departure:   false,
      updated:     moment().unix()
    });
  });

  obj.sort(function(a,b){return a.time-b.time;});

  return obj;
};

Parsers.wmata_train = function(content) {
  var obj      = [];
  var arrivals = content.Trains;

  var direction_translate = {0:'inbound', 1:'outbound'}; //TODO(Richard): Confirm that these are correct with WMATA people.

  var current_time = moment().unix();

  _.each(arrivals,function(item){
    var secs_until_arrival = parseInt(item.Min,10);
    if(!isNaN(secs_until_arrival))
      secs_until_arrival = 60*item.Min;
    else
      secs_until_arrival = 0;

    obj.push({
      time:        current_time + secs_until_arrival,
      direction:   false,
      route:       item.Line,
      description: 'To ' + item.DestinationName,
      actual:      true,
      departure:   false,
      updated:     current_time,
      platform:    false
    });
  });
/* //Removes duplicate trains if that becomes an issue at stations with multiple platforms
  obj = _.uniq(obj, false, function(item,key,a) {
    return item.time.toString()+'-'+item.route+'-'+item.description;
  });
*/
  obj.sort(function(a,b){return a.time-b.time;});

  return obj;
};

/*
|----------------------------------------------------------------------------------------------------
| NextBus API
| Cities: UMN Campus Connector
| Format: xml
|----------------------------------------------------------------------------------------------------
*/
//TODO: Add route description

Parsers.nextbus = function(content) {
  var obj = [];

  //Translates ugly route names to nice route names for specific agencies
  var route_translate={
    'University of Minnesota':{
      'connector':  'CC',
      'circulator': '120',
      'eastbank':   'EBC',
      'stpaul':     'StPC'
    }
  };

  var direction_translate = {
    west:  'west',
    east:  'east',
    south: 'south',
    north: 'north',
    loop:  'loop'
  };

  _.each(content.body.predictions, function(predictionlist) {
    _.each(predictionlist.direction, function(direction){
      _.each(direction.prediction, function(prediction){
        var item      = prediction.$;

        if(typeof(direction_translate[item.dirTag])!=='undefined')
          item.dirTag = direction_translate[item.dirTag];
        else
          console.error('Unrecognised NextBus direction!', item.dirTag);

        if(!route_translate[predictionlist.$.agencyTitle])
          console.error('Unrecognised NextBus agency: ', predictionlist.$.agencyTitle);
        else if(!route_translate[predictionlist.$.agencyTitle][item.routeTag])
          console.error('Unrecognised route name ',item.routeTag,' for agency ',predictionlist.$.agencyTitle);
        else
          item.routeTag=route_translate[predictionlist.$.agencyTitle];

        var actual=true;
        if(item.isScheduleBased=="true")
          actual=false;

        var branch="";
        if(item.branch)
          branch=item.branch;

        var isDeparture=(item.isDeparture=="true");

        obj.push({
          time:        Math.floor(item.epochTime/1000),
          direction:   item.dirTag,
          route:       predictionlist.$.routeTag+branch,
          description: predictionlist.$.routeTitle,
          actual:      actual,
          departure:   isDeparture,
          updated:     moment().unix()
        });
      });
    });
  });

  obj.sort(function(a,b){return a.time-b.time;});

  return obj;
};

/*
|----------------------------------------------------------------------------------------------------
| LA Metro
| Cities: Los Angeles
| Format: json
| Description: None, Louis built this from the ground up, yo yo.
|----------------------------------------------------------------------------------------------------
*/

/*

JSON Format:

block_id: "4601000"
is_departing: false
minutes: 3
route_id: "460"
run_id: "460_124_0"
seconds: 18
*/

Parsers.lametro = function(content) {
  
  var obj = [];

  var items=content.items;

  for(var i = 0, len = items.length; i < len; i++) {
    $.getJSON("http://api.metro.net/agencies/lametro/routes/"+items[i].route_id+"/", function(rdata){
      $("tr[data-route='"+rdata.id+"']").each(function(i, el){
        $(el).children().eq(1).children().eq(0).text(
          rdata.display_name.replace(rdata.display_name.split(" ")[0], "")
          );
      });
    });
    obj.push({
      'DepartureText':  items[i].minutes + " Min",
      'DepartureTime':  ((new Date).getTime()/1000)+(items[i].minutes*60),
      'RouteDirection': "",
      'Route':          items[i].route_id,
      'Description':    "Loading..." //TODO(Richard): Why is this here?
    });
  }

  return obj;
};

/*
|----------------------------------------------------------------------------------------------------
| Airports
| Cities: EveryCity
| Format: json
| Description: https://developer.flightstats.com/api-docs/flightstatus/v2/airport
|----------------------------------------------------------------------------------------------------
*/

Parsers.airport = function(content) {
  function LookUpAirportName(code){
    for(var j=0;j<content.appendix.airports.length;j++)
      if(content.appendix.airports[j].fs == code)
        return content.appendix.airports[j].name;
    return "(NO AIRPORT FOUND)";
  }

  function LookUpCarrierName(code){
    for(var j=0;j<content.appendix.airlines.length;j++)
      if(content.appendix.airlines[j].fs == code)
        return content.appendix.airlines[j].name;
    return "(NO CARRIER FOUND)";
  }

  function FlightOrder(a,b){
    //Give Delta Priortiy
    if(a.substr(0,2)=="DL")
      return -1;
    else if(b.substr(0,2)=="DL")
      return 1;
    else if(a.substr(0,2)=="AA")
      return -1;
    else if(b.substr(0,2)=="AA")
      return 1;
    else if(a.substr(0,2)=="US")
      return -1;
    else if(b.substr(0,2)=="US")
      return 1;
    else
      return a<b;
  }

  ret=[];
  for(var i=0;i<content.flightStatuses.length;i++){
    var flightret = {};
    var flight    = content.flightStatuses[i];
    flightret.dest    = LookUpAirportName(flight.arrivalAirportFsCode);
    //flightret.carrier = LookUpCarrierName(flight.carrierFsCode);

    flightret.dest = flightret.dest.replace('Municipal Airport','');
    flightret.dest = flightret.dest.replace('International',"Intn'l");
    flightret.dest = flightret.dest.replace('Airport','');
    flightret.dest = flightret.dest.trim();

    console.log(flight);

    flightret.flight=[flight.carrierFsCode+flight.flightNumber];
    if(typeof(flight.codeshares)!=="undefined")
      for(var j=0;j<flight.codeshares.length;j++)
        flightret.flight.push(flight.codeshares[j].fsCode+flight.codeshares[j].flightNumber);

    flightret.flight.sort(FlightOrder);

    //TODO(Richard): Figure out the technical differences between these
    flightret.departureTime = moment.utc(flight.departureDate.dateUtc).valueOf()/1000;
    //if(typeof(flight.operationalTimes.scheduledGateDeparture)!=="undefined")
    //  flightret.scheduledDepartureTime = moment.utc(flight.operationalTimes.scheduledGateDeparture.dateUtc).valueOf()/1000;
    if(typeof(flight.operationalTimes.estimatedGateDeparture)!=="undefined")
      flightret.DepartureTime = moment.utc(flight.operationalTimes.estimatedGateDeparture.dateUtc).valueOf()/1000;
    ret.push(flightret);
  }

  return ret;
};

/*
|----------------------------------------------------------------------------------------------------
| San Diego
| Cities: San Diego
| Format: json
| Description: None, Louis built this from the ground up, yo yo yo yo.
| TODO(Richard): It looks like Louis never finished this.
|----------------------------------------------------------------------------------------------------
*/

Parsers.sandiego = function(content) {
  var obj = [];

  obj.push({
    'DepartureText':  "TESTTEXT",
    'DepartureTime':  9999999999999999999999999,
    'RouteDirection': "",
    'Route':          "TESTRT",
    'Description':    "TESTDESC"
  });

  console.log("CALLED");

  return obj;
};

Parsers.zipcar = function(content){
  if(content.success!==true){
    console.error('Failed to parser ZipCar content: ',content);
    return {};
  }

  var vehicles=[];
  _.each(content.locationVehicles, function(vehicle){
    var obj={
      hourlyCost:   vehicle.hourlyCost,
      dailyCost:    vehicle.dailyCost,
      hourlyCostFm: vehicle.hourlyCostFm,
      dailyCostFm:  vehicle.dailyCostFm,
      description:  vehicle.description,
      vehicleId:    vehicle.vehicleId,
      modelId:      vehicle.modelId
    };
    if(typeof(ZipCarModels[vehicle.modelId])!=='undefined')
      obj=_.extend(obj,ZipCarModels[vehicle.modelId]);
    else
      console.error('Unrecognised ZipCar model: ',vehicle.modelId);
    vehicles.push(obj);
  });

  return vehicles;
};

Parsers.routeshout = function(content){
  if(content.status!='ok')
    return [];

  var events = content.response;
  var data   = [];

  console.log(events);

  var direction_translate={Loop:"loop",Outbound:'outbound'};

  _.each(events, function(event){
    if(event.depart_complete)
      return;

    var departure_time = event.departure_time;
    departure_time = moment(departure_time);

    var direction=event.direction;
    if(typeof(direction_translate[direction])!=='undefined')
      direction = direction_translate[direction];
    else {
      console.error('WARNING: Unrecognised RouteShout direction', direction);
    }

    var datum = {
      time:           departure_time.unix(),
      direction:      direction,
      route:          event.route_short_name,
      description:    event.route_long_name,
      actual:         (event.type=='predicted'),
      departure:      true,
      updated:        moment().unix()
    };

    data.push(datum);
  });

  //TODO(Richard): Do this at one level higher in the abstraction.
  data.sort(function(a,b){return a.time-b.time;});

  return data;
};

Parsers.hourcar = function(content) {
  return content.vehicle_types;
};

Parsers.onebusaway = function(content) {
  var obj = [];
  var direction_translate = {
    W:  'west',
    E:  'east',
    S: 'south',
    N: 'north',
    NE: 'north',
    NW: 'north',
    SE: 'south',
    SW: 'south',
  };
  
  var stop;

  if(!content.data) {
    return;
  }

  if(content.data.references) {
    stop = content.data.references.stops[0];
    content = content.data.entry.arrivalsAndDepartures;
  } else {
    stop = content.data.stop;
    content = content.data.arrivalsAndDepartures;
  }

  var direction = direction_translate[stop.direction];

  if(direction === undefined) {
    direction = 'outinbound';
  }

  for(var i = 0, len = content.length; i < len; i++) {

    var time, acutal, minAway, shortName;

    if (content[i].predictedArrivalTime) {
      time = content[i].predictedArrivalTime;
      actual = true;
    } else {
      time = content[i].scheduledArrivalTime;
      actual = false;
    }

    if(content[i].routeShortName === "") {
      if(content[i].stopId.search('_S_') !== -1) {
        shortName = 'SOUNDER';
      } else if(content[i].stopId.search('_TL_') !== -1) {
        shortName = 'TACOMA';
      }
    } else {
      shortName = content[i].routeShortName;
    }

    minAway = Math.floor( ( moment( parseInt(time) ).unix() - moment().unix() ) / 60 );

    if(minAway > 0) {
      obj.push({
        time:        moment(time).unix(),
        direction:   direction,
        route:       shortName,
        description: content[i].tripHeadsign,
        actual:      actual,
        departure:   true,
        updated:     moment().unix()
      });
    }
  }

  //TODO(Richard): Do this at one level higher in the abstraction.
  obj.sort(function(a,b){return a.time-b.time;});

  return obj;
};

Parsers.siri = function(content){
  content = content.Siri.StopMonitoringDelivery;
  if(content.length!=1)
    console.error('ERROR: Salt Lake City real-time has more than one Delivery.');
  content = content[0].MonitoredStopVisit;
  if(content.length!=1)
    console.error('ERROR: Salt Lake City real-time has more than one Monitored Stop.');
  content = content[0].MonitoredVehicleJourney;

  var current_time = moment().unix();

  var journeys = [];
  _.each(content, function(journey){
    var secs_til_depart = parseInt(journey.MonitoredCall[0].Extensions[0].EstimatedDepartureTime[0],10);
    
    var updated         = moment(journey.Extensions[0].LastGPSFix[0]);
    updated = utility.toMomentInTimezone(updated,'America/Chicago');

    var data = {
      time:        current_time+secs_til_depart,
      direction:   null,
      route:       journey.LineRef[0],
      description: _.titleize(journey.PublishedLineName[0] + ' ' + journey.DirectionRef[0]),
      actual:      (journey.Extensions[0].Scheduled[0]=='False'),
      departure:   true,
      updated:     updated.unix()
    };

    journeys.push(data);
  });

  journeys.sort(function(a,b){return a.time-b.time;});

  return journeys;
};

exports.parsers = Parsers;