/*
|----------------------------------------------------------------------------------------------------
| RidesharesView
|----------------------------------------------------------------------------------------------------
*/

Omg.Views.Rideshares = Backbone.Marionette.ItemView.extend({
  
  template: JST['_jst/rideshares.html'],
  uberTemplate: JST['_jst/uber.html'],

  events: {
    'click .uber': 'expandUber',
    'click .uber-option': 'launchUber',
    'click .sidecar': 'launchSidecar',
    'click .hailo': 'launchHailo'
  },

  initialize: function() {
    this.render();

    this.listenTo(Omg.vent, 'destination_location:found', this.destinationFound, this);
  },

  rerenderRideshares: function() {
    var self = this;

    this.collection.each(function(data) {
      
      // Uber
      if(data.get('name') === 'uber') {
        if(data.get('error') || data.attributes.times.length == 0) {
          self.$el.find('.uber-preview').html('No cars available');
        } else {
          var min = Math.floor( _.min(_.pluck( data.attributes.times, "estimate")) / 60 );
          if (min === 0 ) {
            min = 'Less than 1';
          }
          self.$el.find('.uber-preview').html( min + ' min away');
          self.$el.find('.uber-results').html( self.uberTemplate({ min: min, items: data.attributes.times }) );
        }
      }

      // Sidecar
      if(data.get('name') === 'sidecar') {
        if(data.get('error')) {
          self.$el.find('.sidecar').hide();
        } else { 
          if (data.get('closestEta') !== -1) {
            var stopEta = self.$el.find('.sidecar .eta');
            if(stopEta) {
              stopEta.html( stopEta.html().replace('{eta}', Math.floor( data.get('closestEta') / 60 ) ) );
              self.$el.find('.sidecar').show();
            }
            
            //var pickup = self.$el.find('.sidecar .pickup-required');
            //deepLink.attr('href', deepLink.attr('href').replace('{lat}', self.center.lat).replace('{lon}', self.center.lon) );
          } else {
            self.$el.find('.sidecar').hide();
          }
        }
      }

      // Hailo
      if(data.get('name') === 'hailo') {
        if(data.get('error')) {
          self.$el.find('.hailo').hide();
        } else {
          var stopEta = self.$el.find('.hailo .eta');
          if(stopEta) {
            stopEta.html( stopEta.html().replace('{eta}', data.get('etas')[0].eta ) );
            self.$el.find('.hailo').show();
          }
        }
      }

    });
  },

  update: function(currentLocation) {
    var self = this;
    this.currentLocation = currentLocation;
    
    this.collection.fetch({ 
      
      data: {
        lat: currentLocation.lat, lon: currentLocation.lon, timeout:3000
      },
      
      success: function() {
        self.rerenderRideshares();
      }, 

      error: function() {
        console.log('Error: Could not retrieve rideshares.');
      }

    });
  },

  expandUber: function() {
    this.$el.find('.uber-results').toggle();
  },

  launchUber: function(e) {
    e.stopPropagation();
    
    var target = $(e.currentTarget);
    Omg.Utils.launcher.openApp('Uber', this.currentLocation.lat, this.currentLocation.lon, { product_id: target.data('product-id') });
  },

  launchSidecar: function(e) {
    Omg.vent.trigger('destination_location:show', { app_name: 'Sidecar' });
  },

  destinationFound: function(args) {
    var self = this;
    
    if( args.type === 'Sidecar') {
      Omg.location.geocode(args.address).then(function(location) {
        Omg.Utils.launcher.openApp('Sidecar', self.currentLocation.lat, self.currentLocation.lon, { lat: location.lat, lon: location.lon });
      });
    }
  },

  launchHailo: function(e) {
    var self = this;
    Omg.location.reverseGeocode(this.currentLocation.lat, this.currentLocation.lon).then(function(address) {
      Omg.Utils.launcher.openApp('Hailo', self.currentLocation.lat, self.currentLocation.lon, { address: address });
    });
  }

});