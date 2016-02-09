$.support.cors = true;

(function() {
  var proxiedSync = Backbone.sync;
  Backbone.sync = function(method, model, options) {

    options || (options = {});
    if (!options.crossDomain) {
      options.crossDomain = true;
    }

    options.beforeSend = function(xhr) {
      if ( model.url ) {
        if ( typeof(model.url) === "function" ) {
          if ( model.url().match(AppConfig.backendUrl) && !model.url().match(':3001') ) {
            xhr.setRequestHeader('X-Requested-With' , 'XMLHttpRequest');
          }
        } else if( model.url.match(AppConfig.backendUrl) && !model.url.match(':3001') ) {
          xhr.setRequestHeader('X-Requested-With' , 'XMLHttpRequest');
        }
      }
    }

    // if (!options.xhrFields) {
    //   options.xhrFields = {withCredentials:true};
    // }
    return proxiedSync(method, model, options);
  };
})();

/*
|----------------------------------------------------------------------------------------------------
| Backbone Marionette: Startup
|----------------------------------------------------------------------------------------------------
*/

Omg.user     = new Omg.Models.User();
Omg.location = new Omg.Models.Geolocation();
Omg.filters  = new Omg.Models.Filter();
Omg.currentStop = null;
Omg.list_visible = false;
Omg.map_visible = false;
Omg.list_first_viewed = false;

Omg.car2go   = new Omg.Models.Car2Go();
Omg.messages = new Omg.Models.Messages();
Omg.device = 'Web';

Omg.route = {
  previous: 'list',
  current: 'list'
};

Omg.addRegions({
  bodyRegion: "#application"
});

Omg.addInitializer(function(options) {
  Omg.router = new Omg.Routers.AppRouter();
  Backbone.history.start();

  // Setup interval for updating app
  window.setInterval(function() {
    Omg.vent.trigger('app:tick');
  }, 60000);
});

/*
|----------------------------------------------------------------------------------------------------
| PhoneGap Startup
|----------------------------------------------------------------------------------------------------
*/

function onDeviceReady() {
  Push.initialize();
  Omg.start();
  Omg.vent.trigger('app:ready');
}

function logEvent(title, eventType, page, label) {
  if(window.Flurry) {
    
    if(eventType === 'pageview') {
      //Flurry.logEvent(title);
      analytics.trackView(title);
    } else if (eventType === 'event') {
      //Flurry.logEvent(page + ':' + title + ':' + label);
      analytics.trackEvent(page, title, label);
    }

  } else {
    if(eventType === 'pageview') {
      ga('send', eventType, {'page': page,'title': title});
    } else if (eventType === 'event') {
      ga('send', eventType, page, title, label);
    }
    
  }
}

function loadUrl(url) {
  window.open(url, '_blank', 'location=yes,toolbar=yes');
}

if ( document.location.protocol === "file:" ) {
  document.addEventListener("deviceready", function() {

    Omg.device = device.platform;
    onDeviceReady();
    
    Omg.Google.initialize();

    // setFlurryId();
    // Flurry.setAppVersion('1.0');
    // Flurry.setShowErrorInLogEnabled('No');
    // Flurry.setEventLoggingEnabled('Yes');
    // Flurry.setDebugLogEnabled('No');
    // Flurry.setSecureTransportEnabled('No');
    // Flurry.setSessionContinueSeconds(7200);
    // Flurry.setCrashReportingEnabled('No');
    
    // Flurry.startSession(flurryid);

    analytics.startTrackerWithId('UA-41367617-6');
    analytics.trackEvent('Test', 'TestStats');

    $('body').on('click', "a[target='_blank']", function(e) {
      e.preventDefault();
      var target = $(e.target);
      loadUrl(target[0].href);
    });

    // Fix stupid statusbar issues with iOS 7+.
    if(Omg.device === 'iOS' && parseFloat(device.version) > 6 ) {
      console.log("device ready!!! ios");
      console.log($('body'));
      $('body').addClass('platform-ios7plus-cordova');
    }
  }, false);
} else {
  $(function() {
    onDeviceReady();
  });
}

//Set AJAX timeout to 10 seconds
$.ajaxSetup({
  timeout: 10*1000
});