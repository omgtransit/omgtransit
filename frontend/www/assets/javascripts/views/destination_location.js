/*
|----------------------------------------------------------------------------------------------------
| PickupLocationView
|----------------------------------------------------------------------------------------------------
*/

Omg.Views.DestinationLocation = Backbone.Marionette.ItemView.extend({
  template: JST['_jst/destination_location.html'],

  className: 'overlay overlay-contentscale',
  visible: false,

  events: {
    'click .btn-destination-lookup': 'destination',
    'click .overlay-close':   'close'
  },

  initialize: function() {
    this.listenTo(Omg.vent, 'destination_location:show', this.show, this);
  },

  show: function(args) {
    this.$el.addClass('open');
    this.type = args.app_name;
    this.$el.find('.app-description').html( this.$el.find('.app-description').html().replace('{app_name}', args.app_name) );
  },

  close: function(e) {
    if (e) { e.preventDefault(); }
    this.$el.removeClass('open');
  },

  destination: function(e) {
    // var target = $(e.currentTarget);
    // var ret={address:target.data('address'), lat:target.data('lat'), lon:target.data('lon')};
    // Omg.location.cacheAddressAndLocation(target.data('address'), target.data('lat'), target.data('lon'));
    // this.deferred.resolve(ret);
    // this.deferred=false;
    
    var address = this.$el.find('#destination-location').val();
    if( address !== "" ) {
      this.$el.removeClass('open');
      Omg.vent.trigger('destination_location:found', { address: address, type: this.type });
    }
  }
});