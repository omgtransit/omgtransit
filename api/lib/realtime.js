var request         = require('request');
var parser          = require('../lib/parser');
var Q               = require('q');
var redis           = require("redis");
var redisclient     = redis.createClient();
var _               = require('lodash');
var transit_defs    = require('../lib/transit_defs');
var parseString     = require('xml2js').parseString;
var moment          = require('moment');
var realtime_router = require('../lib/realtime_router');
require('log-timestamp');

//Constructor of Realtime object
//Takes a stopid of the form "<SYSTEM>/<STOPID>" or "<SYSTEM>/<SUBSYSTEM>/<STOPID>"
exports.Realtime = function(stopid){
  //Split up the stopid 
  var stopinfo  = stopid.split('/');
  this.rediskey = stopid;

  //Make sure everything is lower-case
  _.map(stopinfo, function(i) { return i.toLowerCase(); });

  //Assign property names to parts of the stop id
  this.system = stopinfo[0];
  if (stopinfo.length==2) {
    this.stopid = stopinfo[1].split('-');
    if(this.stopid.length==1){
      this.stopid = this.stopid[0];
    } else {
      this.subsystem = this.stopid[0];
      this.stopid    = this.stopid[1];
    }
  } else {
    console.log("Wrong number of arguemnts in stopid: "+stopid);
    this.good      = false;
    return;
  }

  //Check to see if the transit system exists
  if(typeof(transit_defs.defs[this.system])==="undefined"){
    console.log("Could not find system: "+this.system);
    this.good=false;
    return;
  }

  this.good=true;

  //Copy transit system properties to this object
  _.extend(this, transit_defs.defs[this.system]);

  var nowutc=moment().utc();

  //These lines send data to the warp loader. The warp loader stores sorted sets
  //for each hour of the day and each day of the week.
  var redis_bucket = 'omg-warp-' + nowutc.format('d-HH');
  redisclient.zincrby([redis_bucket, 1, stopid], function(err, response){
    if(err)
      console.error('Error incrementing into warp loader.');
  });

  redisclient.rpush(['omg-get-stop',nowutc.unix(),stopid], function(err,resp){
    if(err)
      console.error('Error adding stop to the get stop list.');
  });

  //Since bulkcached stops do not have realtime urls, there may not be one
  //specified. Hence we need to opt out of looking for it here.
  if(this.bulkcached)
    return;

  if(this.url=='router'){
    var router_info = realtime_router.parsers[this.system](this.stopid);
    if(router_info===false){
      console.error('Warning: Unroutable stopid ',this.stopid,' for ',this.system);
      return;
    } else {
      this.url    = router_info.url;
      this.parser = router_info.parser;
    }
  }

  if(typeof(this.url)!=="undefined"){
    this.url = this.url.replace( "{stop_id}",   this.stopid    );
    this.url = this.url.replace( "{subsystem}", this.subsystem );

    if(this.system=='air'){
      this.url = this.url.replace( '{year}',  nowutc.format('YYYY'));
      this.url = this.url.replace( '{month}', nowutc.format('MM'));
      this.url = this.url.replace( '{day}',   nowutc.format('DD'));
      this.url = this.url.replace( '{hour}',  nowutc.format('HH'));
    }
  } else {
    this.url = false;
    console.error('Undefined realtime url for: ', this.system);
  }
}

//Fetches XML/JSON from this Realtime object's URL and performs appropriate
//parsing
exports.Realtime.prototype._fetchRealtime = function(){
  var self     = this;
  var deferred = Q.defer();
  console.log('Fetching', self.url);

  //Keep track of daily system load
  var current_time = moment();
  redisclient.hincrby(['omg-daily-stat-'+self.system, current_time.year()+'-'+current_time.dayOfYear(), 1], function(err, response){
    if(err)
      console.error('Warning: Failed to increment omg-daily-stat:', err);
  });

  redisclient.zincrby(['omg-sec-stat-'+self.system, -1, current_time.unix()], function(err, response){
    if(err)
      console.error('Warning: Failed to increment omg-sec-stat:', err);
  });

  request({ url: self.url, timeout: 2000 }, function (error, response, body) {
    if(error || response.statusCode!=200){
      console.error('Error ('+self.rediskey+') getting '+self.url);
      deferred.resolve(false)
      return deferred.promise;
    }
    
    if(self.format === 'json') {
      body=JSON.parse(body);
      if(self.parser)
        body = parser.parsers[self.parser](body);
      deferred.resolve( body );
    } else if (self.format === 'xml') {
      parseString(body, function (err, body) {
        if(self.parser)
          body = parser.parsers[self.parser](body);
        deferred.resolve( body );
      });
    } else {
      console.error('Error: No format specified for', self.system);
    }
  });

  return deferred.promise;
}

//Returns a JSON object appropriately formatted for consumption by the client
//@param[in] stopid   An id of the form "msp/16116" or "cyclocity/paris/23423"
exports.Realtime.prototype.getRealtime = function(){
  var self     = this;
  var deferred = Q.defer();

  redisclient.get(this.rediskey,
    function(err, reply) {
      if(err){
        console.error("Error fetching '"+self.rediskey+"': "+err);
        deferred.resolve(false);
        return;
      } else if (reply) {
        deferred.resolve(JSON.parse(reply));
        return;
      } else if (self.bulkcached) {
        console.error('Failed to get a bulkcached datum for',self.rediskey);
        deferred.resolve(false);
      } else if (!self.url){
        console.error('Warning: ',self.system,' did not have a stop url.');
        deferred.resolve(false);
      } else {
        self._fetchRealtime().then(function(result){
          redisclient.set   (self.rediskey, JSON.stringify(result));
          redisclient.expire(self.rediskey, 50); //TODO(Richard): Make sure this is set to a value specific for the transit provider
          deferred.resolve( result );
        });
      }
    }
  );

  return deferred.promise;
}