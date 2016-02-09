var Push = {
  notification: null,

  initialize: function() {
    if ( window.plugins ) {
      this.setupDeviceNotifications();
    } else if ( window.webkitNotifications ) {
      //this.setupWebNotifications();
    }
  },

  enabled: function() {
    return (Push.notification) ? true : false;
  },

  authorized: function() {
    if (localStorage.getItem('device_token') !== null) {
      return true;
    }

    return false;
  },

  setupDeviceNotifications: function() {
    Push.notification = window.plugins.pushNotification;
    Push.platform = 'device';

    if ( device.platform == 'android' || device.platform == 'Android' ) {
      Push.notification.register(
        Push.successHandler,
        Push.errorHandler, {
          "senderID": "{SENDER_ID}",
          "ecb": "onNotificationGCM"
        });
    }
    else
    {
      Push.notification.register(
        Push.tokenHandler,
        Push.errorHandler, {
          "badge":"true",
          "sound":"true",
          "alert":"true",
          "ecb":"onNotificationAPN"
      });
    }
  },

  setupWebNotifications: function() {
    Push.notification = window.webkitNotifications;
    localStorage['platform'] = 'Web';
    Push.platform = 'Web';
  },

  requestWebPermission: function(callback) {
    Push.notification.requestPermission( function(status) {
      if (Push.notification.checkPermission() == 0) {
        localStorage['platform'] = 'Web';
        Push.platform = 'Web';
        
        if ( callback ) {
          callback(true);
        }
      } else {
        if ( callback ) {
          callback(false);
        }
      }
    });
  },

  sendWebNotification: function() {
    if (Push.notification.checkPermission() == 0) { // 0 is PERMISSION_ALLOWED
      notification = Push.notification.createNotification('icon.png', 'OMGTransit', 'Notification from the Web!');
      notification.show();
    } else {
      Push.requestWebPermission();
    }

  },

  successHandler: function(result) {
    localStorage['platform'] = 'Android';
    Push.platform = 'Android';
  },

  errorHandler: function(error) {
    console.log('error = ' + error);
  },

  /*
  |----------------------------------------------------------------------------------------------------
  | Apple Push Section
  |----------------------------------------------------------------------------------------------------
  */

  tokenHandler: function(result) {
    // Your iOS push server needs to know the token before it can push to this device
    // here is where you might want to send it the token for later use.
    localStorage['device_token'] = result;
    localStorage['platform'] = 'iOS';

    Push.platform = 'iOS';
  }

}

/*
|----------------------------------------------------------------------------------------------------
| Apple Response Handler for Push.
|----------------------------------------------------------------------------------------------------
*/

function onNotificationAPN (event) {
  if ( event.alert ) {
    navigator.notification.alert(event.alert, null, "OMGTransit");
  }

  if ( event.rurl ) {
    Omg.router.navigate('#/stop/' + event.rurl);
  }

  if ( event.sound ) {
    var snd = new Media(event.sound);
    snd.play();
  }

  if ( event.badge ) {
    Push.notification.setApplicationIconBadgeNumber(Push.successHandler, Push.errorHandler, event.badge);
  }
  navigator.notification.vibrate();
}

/*
|----------------------------------------------------------------------------------------------------
| Android Push Notification Handler.
|----------------------------------------------------------------------------------------------------
*/

function onNotificationGCM(e) {
  console.log('notfication gcm');
  switch( e.event ) {
    case 'registered':
      if ( e.regid.length > 0 ) {
        // Your GCM push server needs to know the regID before it can push to this device
        // here is where you might want to send it the regID for later use.
        console.log("regID = " + e.regid);
        localStorage['device_token'] = e.regid;
      }
    break;

    case 'message':
        // if this flag is set, this notification happened while we were in the foreground.
        // you might want to play a sound to get the user's attention, throw up a dialog, etc.
        if ( e.foreground )
        {
            // if the notification contains a soundname, play it.
            // var my_media = new Media("/android_asset/www/"+e.soundname);
            // my_media.play();
        }
        else
        {  // otherwise we were launched because the user touched a notification in the notification tray.
            // if ( e.coldstart )
            // {
            //     $("#app-status-ul").append('<li>--COLDSTART NOTIFICATION--' + '</li>');
            // }
            // else
            // {
            //     $("#app-status-ul").append('<li>--BACKGROUND NOTIFICATION--' + '</li>');
            // }
        }

        // $("#app-status-ul").append('<li>MESSAGE -> MSG: ' + e.payload.message + '</li>');
        // $("#app-status-ul").append('<li>MESSAGE -> MSGCNT: ' + e.payload.msgcnt + '</li>');
        navigator.notification.alert(e.payload.message, null, "OMGTransit");
        navigator.notification.vibrate();
        
        if(e.payload.rurl) {
          Omg.router.navigate('#/stop/' + e.payload.rurl);
        }
    break;

    case 'error':
        //$("#app-status-ul").append('<li>ERROR -> MSG:' + e.msg + '</li>');
    break;

    default:
        //$("#app-status-ul").append('<li>EVENT -> Unknown, an event was received and we do not know what it is</li>');
    break;
  }
}