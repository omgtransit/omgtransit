Omg.Views.GeolocationAlert = Backbone.View.extend({
  
  events: {
    'click .btn-ok': 'okClicked',
  },

  error: function() {
    if( Omg.device == "Web") {
      this.$el.html('<h4><i class="icon-warning-sign"></i> &nbsp;Unable to get location.</h4><div class="geo-info"><div class="geo-message">Please allow access to your location.</div><img src="assets/images/location-web.png" width="500"></div> <hr><p>I\'ll put you in Minneapolis, Minnesota to demonstrate how I work.</p> <button class="btn-red btn-ok">OK</button>');
    } else if ( Omg.device == "iOS" ) {
      this.$el.html('<h4><i class="icon-warning-sign"></i> &nbsp;Unable to get location.</h4><div class="geo-info"><div class="geo-message">Please enable location services.</div><img src="assets/images/location-ios.png" width="300"></div> <hr><p>I\'ll put you in Minneapolis, Minnesota to demonstrate how I work.</p> <button class="btn-red btn-ok">OK</button>');
    } else if ( Omg.device == "Android" ) {
      this.$el.html('<h4><i class="icon-warning-sign"></i> &nbsp;Unable to get location.</h4><div class="geo-info"><div class="geo-message">Please enable High Accuracy mode.</div><img src="assets/images/location-android.png" width="300"></div> <hr><p>I\'ll put you in Minneapolis, Minnesota to demonstrate how I work.</p> <button class="btn-red btn-ok">OK</button>');
    }
  },

  okClicked: function() {
    Omg.vent.trigger('geolocation-alert:ok:clicked');
  }

});