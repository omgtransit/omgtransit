var Parsers = {};

Parsers.chicago = function(stopid){
  var bus_url   = "http://www.ctabustracker.com/bustime/api/v1/getpredictions?key=" + process.env.cta_bus_key + "&stpid={stop_id}";
  var train_url = "http://lapi.transitchicago.com/api/1.0/ttarrivals.aspx?key=" + process.env.cta_train_key + "&mapid={stop_id}"
  if(0<=stopid && stopid<=29999)
    return {url:bus_url, parser:'clever'};
  else if (40000<=stopid && stopid<=49999)
    return {url:train_url, parser:'clevertrain'};
  else
    return false;
};

Parsers.washingtondc = function(stopid){
  var bus_url   = 'http://api.wmata.com/NextBusService.svc/json/jPredictions?StopID={stop_id}&api_key=' + process.env.wdc_key
  var train_url = 'http://api.wmata.com/StationPrediction.svc/json/GetPrediction/{stop_id}?api_key=' + process.env.wdc_key

  var firstletter = stopid.charAt(0);
  if ("A" <= firstletter && firstletter <= "Z")
    return {url:train_url, parser:'wmata_train'};
  else
    return {url:bus_url, parser:'wmata_bus'};
};




exports.parsers = Parsers;