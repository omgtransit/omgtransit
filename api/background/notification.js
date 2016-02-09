var timers        = require("timers"),
    http          = require("http"),
    moment        = require('moment'),
    request       = require('request'),
    _             = require('lodash'),
    apn           = require('apn'),
    gcm           = require('node-gcm'),
    realtime      = require('../lib/realtime.js'),
    Q             = require('q'),
    Db            = require('mongodb').Db,
    ObjectID      = require('mongodb').ObjectID;

var mongoClient;
var ___backgroundTimer;
require('log-timestamp');
require('dotenv').config();

Db.connect(process.env.mongo_host, function(err, db) {
  if(err) {
    console.log("Error Starting up Mongo!@");
    console.log(err);
    return;
  }
  console.log('Starting up mongo.');
  mongoClient = db;

});

msg = false;

/*
|----------------------------------------------------------------------------------------------------
| Apple Push Notification Connection Settings
|----------------------------------------------------------------------------------------------------
*/
var apnOptions;
var certPath = process.cwd() + '/certs/';

if ( process.env.NODE_ENV === 'production' ) {
  apnOptions = {
    cert: certPath + 'prod_exported_certificate.pem',
    certData: null,                                
    key: certPath + 'prod_exported_certificate.pem',                       
    keyData: null,
    gateway: "gateway.push.apple.com"
  };
} else {
  apnOptions = {
    cert: certPath + 'dev_exported_certificate.pem',
    certData: null,                       
    key: certPath + 'dev_exported_certificate.pem',                       
    keyData: null,
    gateway: "gateway.sandbox.push.apple.com"
  };
}

var apnConnection = new apn.Connection(apnOptions);

/*
|----------------------------------------------------------------------------------------------------
| Child Process to run continously checking for alerts to send out
|----------------------------------------------------------------------------------------------------
*/


  function checkAlerts(data) {
    notification.checkAlerts();
  }

  function init() {
    var count = 0;
    var self = this;

    setInterval(function(){

      try {
        checkAlerts();
      }
      catch(err) {
        console.log("notification.js error: " + err.message + "\n" + err.stack);
      }
    }, 30 * 1000);
  }

/*
|----------------------------------------------------------------------------------------------------
| Notification Helper Methods
|----------------------------------------------------------------------------------------------------
*/

var notification = {

  mongoClient: mongoClient,

  // This is really for testing only...
  setMsg: function(message) {
    msg = message;
  },

  findAlerts: function(tick, offsetTick) {
    var deferred = Q.defer();

    // Search for all alerts within range that have not been sent out AND
    // meet the criteria for ranges.

    // if (alert_time less than tick
    // OR start_time greater than tick)
    // AND now() less than last_recurring_at

    mongoClient.collection('mongo_alerts').find({ alert_time: { $gte: offsetTick }, start_time: { $lte: tick } }).toArray(function(err, response) {
      deferred.resolve( response );
    });

    return deferred.promise;
  },

  checkAlerts: function() {
    // Set the current tick and today ex. (mon)
    var tick = moment().utc().format('H.mm');
    var offsetTick = moment.utc().subtract(5, 'minutes').format('H.mm');
    var today = moment().format('ddd').toLowerCase();

    console.log('Checking Alerts : ' + tick);

    notification.findAlerts( parseFloat(tick), parseFloat(offsetTick) ).then(function(resp) {
    
      if ( resp.length > 0 ) {
        console.log('Found Alerts: ' + tick + '-' + resp.length);
        // We got a good response, let's check out some notifications.
        var results = resp;
     
        for( var i=0, len=results.length; i < len; i++ ) {
          var alert = results[i];

          // ===================================================================================
          // Recurring, but not the right day check
          // Check for recurring status... If it is recurring, and today is not in the list,
          // then try again tomorrow!
          // ===================================================================================
          
          if( alert.recurring && alert.recurring_days.search(today) === -1 ) {
            return;
          }

          // ===================================================================================
          // Recurring, but we have already sent the alert today
          // ===================================================================================          

          if( alert.recurring && alert.last_recurring_at && moment(alert.last_recurring_at).format('MM/DD/YYYY') === moment().format('MM/DD/YYYY') ) {
            return;
          }

          // Make sure we have a platform and device to send to.
          if ( alert.platform && alert.device_token ) {

            var realtimestop = new realtime.Realtime(alert.realtime_url.toLowerCase());
            
            // Determine actual distance away that bus is.
            realtimestop.getRealtime().then(function(result){
              if ( result ) {
                var sendResult = notification.shouldWeSend(result, alert);
    
                // There is an alert time that matches ours. Let's send it out.            
                if( sendResult.status ) {

                  var message = notification.determineMessage( sendResult.minAway, alert.route, alert.stop_name );
                  
                  if(message) {
                    notification.pushMessage(alert, message);
                  }

                // If times up, just send the time.
                } else if ( !sendResult.status && offsetTick > alert.alert_time && sendResult.minAway !== undefined ) {
                  var message = notification.determineLateMessage( sendResult.minAway, alert.route, alert.stop_name );
                  if(message) {
                    notification.pushMessage(alert, message);
                  } else {
                    var message = notification.determineSuperLateMessage(alert.route, alert.stop_name);
                    notification.pushMessage(alert, message);
                  }
                }
    
              }
            });

          }
        }
      } else {
        console.log('Checking Alerts: None Found');
      }
      
    });
  },

  pushMessage: function(alert, message) {
    var alertSource = alert;

    notification.sendMessage( alertSource.platform, message, alertSource.device_token, alertSource.realtime_url );
    
    if ( alertSource.recurring ) {
      // Otherwise update the alert time for tomorrow.
      notification.updateAlert(alert);
    } else {
      // Delete alert if it was a one time deal.
      notification.deleteAlert(alert);
    }
  },

  updateAlert: function(alert) {
    mongoClient.collection('mongo_alerts').update({ "_id": ObjectID( alert._id ) }, { $set: { last_recurring_at: new Date() } }, function() {});
  },

  deleteAlert: function(alert) {
    mongoClient.collection('mongo_alerts').remove({ "_id": ObjectID( alert._id ) }, function() {});
  },

  shouldWeSend: function(result, alert) {
    var data = result;
    var routes = _.filter(data, function(item) {
      var minAway = moment.utc(item.time*1000).diff(moment.utc()) / 1000 / 60;
      item.minAway = Math.round(minAway);
      return item.route == alert.route
    });

    if (routes.length) {
      // There are some routes available let's sort them by minAway.
      var r = _.sortBy(routes, 'minAway');
      
      // Check for offset vs timeAway...  If the bus is offset away or less push the user.
      if( r[0].minAway <= alert.offset + 1 ) {
        return { status: true, minAway: r[0].minAway };
      }
    }
    return { status: false, minAway: r[0].minAway };
  },

  determineMessage: function(timeAway, route, stop_name) {  
    return 'The ' + route + ' is ' + timeAway + ' min away from ' + stop_name;
  },

  determineLateMessage: function(timeAway, route, stop_name) {
    return 'The ' + route + ' is RUNNING LATE. It is ' + timeAway + ' min away from ' + stop_name;
  },

  determineSuperLateMessage: function(route, stop_name) {
    return 'The ' + route + ' was not found within your specified time. The route may have changed. Try deleting your old alert and adding a new one.';
  },

  sendMessage: function(platform, message, token, realtimeUrl) {
    
    // Determine which platform to send to.
    if ( platform === 'iOS' ) {

      var device = new apn.Device(token);
      var note = new apn.Notification();
      note.expiry = Math.floor(Date.now() / 1000) + 3600;
      note.alert = message;
      note.sound = "ping.aiff";
      note.payload = {'rurl': realtimeUrl };

      apnConnection.pushNotification(note, device);

    } else if ( platform === 'Android' ) {
      
      var note = new gcm.Message();
      var sender = new gcm.Sender(process.env.gcm_android_key);
      var registrationIds = [token];
      note.addData('title', 'OMG Transit');
      note.addData('message', message);
      note.addData('rurl', realtimeUrl);
      //note.collapseKey = 'demo';
      note.delayWhileIdle = false;
      //note.timeToLive = 3;
      sender.send(note, registrationIds, 4,  function(err, result){
        console.log(result);
        console.log(err);
      });
    
    }
  }
};

exports.notification = notification;
init();

// Uncomment to debug Apple push notifications.
// function log(type) {
//   return function() {
//     console.log(type, arguments);
//   }
// }

// apnConnection.on('error', log('error'));
// apnConnection.on('transmitted', log('transmitted'));
// apnConnection.on('timeout', log('timeout'));
// apnConnection.on('connected', log('connected'));
// apnConnection.on('disconnected', log('disconnected'));
// apnConnection.on('socketError', log('socketError'));
// apnConnection.on('transmissionError', log('transmissionError'));
// apnConnection.on('cacheTooSmall', log('cacheTooSmall')); 