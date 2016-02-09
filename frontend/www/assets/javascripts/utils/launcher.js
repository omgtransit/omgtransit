Omg.Utils.isMobile = {
    Android: function() {
        return /Android/i.test(navigator.userAgent);
    },
    BlackBerry: function() {
        return /BlackBerry/i.test(navigator.userAgent);
    },
    iOS: function() {
        return /iPhone|iPad|iPod/i.test(navigator.userAgent);
    },
    Windows: function() {
        return /IEMobile/i.test(navigator.userAgent);
    },
    any: function() {
        return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Windows());
    }
}

Omg.Utils.launcher = {
  openApp: function(type, lat, lon, options) {
      
    var redirectUrl, appUrl, browser=navigator.userAgent.toLowerCase(), scheme;
    
    if(type === 'Uber') {
      
      redirectUrl = "https://m.uber.com/sign-up?client_id={CLIENT_ID}";
      appUrl = 'uber://?action=setPickup&pickup[latitude]=' + lat + '&pickup[longitude]=' + lon + '&product_id=' + options.product_id;
      logEvent('Click', 'event', 'Outbound-Link', 'Uber App');
      
      iosScheme = 'uber://';
      androidScheme = 'com.ubercab';
    
    } else if(type === 'Sidecar') {
      
      redirectUrl = "http://www.side.cr/";
      appUrl = 'sidecar://booking/confirm?source=' + lat + ',' + lon + '&destination=' + options.lat + ',' + options.lon + '&referrer=omgtransit';
      logEvent('Click', 'event', 'Outbound-Link', 'Sidecar App');

      iosScheme = 'sidecar://';
      androidScheme = 'com.sidecarPassenger';
    
    } else if(type === 'Hailo') {
    
      redirectUrl = "https://www.hailoapp.com/";
      appUrl = 'hailo://confirm?pickupCoordinate=' + lat + ',' + lon + '&pickupAddress=' + encodeURIComponent(options.address);
      logEvent('Click', 'event', 'Outbound-Link', 'Hailo App');
      
      iosScheme = 'hailo://';
      androidScheme = 'com.hailocab.consumer';

    }

    // Firefox freaks out with custom urls.
    if(browser.indexOf('firefox') > -1) {
      window.location = redirectUrl; return;
    }

    if (Omg.device === 'Web') {
      var now = new Date().valueOf();
      setTimeout(function () {
          if (new Date().valueOf() - now > 100) return;
          window.location = redirectUrl;
      }, 25);
      window.location = appUrl;

    } else if (Omg.device === 'iOS') {
      navigator.startApp.check(iosScheme, function(message) { /* success */
        navigator.startApp.start(appUrl, function(message) { /* success */
          console.log(message); // => OK
        }, 
        function(error) { /* error */
          console.log(error);
        });
      }, 
      function(error) { /* Not installed */
        window.open(redirectUrl, '_system', 'location=no');
      });

    } else if (Omg.device === 'Android') {
      navigator.startApp.check(androidScheme, function(message) { /* success */
        navigator.startApp.start([
          androidScheme,
          '',
          appUrl
        ], function(message) { /* success */
          console.log(message); // => OK
        }, function(error) { /* error */
          console.log(error);
        });
      }, 
      function(error) { /* Not installed */
        window.open(redirectUrl, '_system', 'location=no');
      });
    }
  }
}