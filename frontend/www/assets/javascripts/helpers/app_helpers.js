function isBikeStop(stop) {
  return stop.stop_type === 'bikeshare_station' || stop.stop_type==='bikeshare_free';
}

function isCar2GoStop(stop) {
  return stop.stop_type === 'car2go';
}

function isZipcarStop(stop) {
  return stop.stop_type === 'zipcar';
}

function isHourcarStop(stop) {
  return stop.stop_type === 'hourcar';
}

function isAirport(stop) {
  return stop.stop_type === 'airport';
}

function isTrainStop(stop) {
  return stop.stop_type === 'intercity_train';
}

function formatStopName(stop) {
  var stop_text = '';
  if ( isCar2GoStop(stop) ) {
    stop_text = 'car2go:' + ' ' + stop.stop_name + '';
  } else if ( isZipcarStop(stop) ) {
    stop_text = 'Zipcar: ' + stop.stop_name;
  } else if ( isHourcarStop(stop) ) {
    stop_text = 'HOURCAR: ' + stop.stop_name;
  } else {
    stop_text = stop.stop_name;
  }
  return stop_text;
}

function showFavorite(stop) {
  return !isCar2GoStop(stop) && !isBikeStop(stop) && !isZipcarStop(stop) && !isHourcarStop(stop);
}

function calculate_distance(stop) {
  if (!stop.sort[0]) {
    return '';
  } else if (stop.sort[0] > 2) {
    return Math.round(stop.sort[0]) + " mi";
  } else if (stop.sort[0] > 0.5) {
    return Math.round(stop.sort[0]) + " mi";
  } else {
    return Math.round(stop.sort[0]*5280) + " ft";
  }
}

function KnownTransitType(stop_type){
  return typeof(AppConfig.transit_mode_icons[stop_type]!=='undefined');
}

function determineListIcon(stop_type) {
  return AppConfig.transit_mode_icons[stop_type].texticon;
}

function determineDeIcon(mode) {
  var mode = mode.toLowerCase();
  var icon = 'transit';

  if (mode === 'car2go' || mode === 'driving') {
    icon = 'driving';
  } else if(mode === 'bicycling' || mode === 'bikeshare') {
    icon = 'bike';
  } else if(mode === 'walking') {
    icon = 'walk';
  }

  return icon;
}

function prettyRounding(num){
  var digit_count = num.toFixed().length;
  if(digit_count==1)
    return Math.round(num);
  else if(digit_count==2)
    return Math.round(num/10)*10;
  else {
    var factor=Math.pow(10,digit_count-2);
    return Math.round(num/factor) * factor;
  }
}