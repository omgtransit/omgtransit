Omg.Views.CachedAddresses = Backbone.Marionette.ItemView.extend({
  template:        JST['_jst/cached_addresses.html'],
  templateContent: JST['_jst/cached_addresses_content.html'],

  className: 'overlay overlay-contentscale',

  visible: false,

  events: {
    'click .overlay-close':              'close',
    'click .cached-addresses-content a': 'chose_cached'
  },

  initialize: function() {
    //This event should have a textbox reference as its first and only argument
    //the textbox will be filled by the value chosen by the user.
    this.listenTo(Omg.vent, 'location:choose_cached', this.show, this);
    this.textbox=false;
  },

  chose_cached: function(e){
    if(e) { e.preventDefault(); }
    var target  = $(e.currentTarget);
    var address = target.data('address');
    if(address!=='close'){
      $(this.textbox).val(address);
      //Trigger an event to let the world know that we've chosen a cached address
      Omg.vent.trigger('location:chose_cached',address);
      if(this.recenter)
        Omg.vent.trigger('location:center_on_lat_lon', target.data('lat'), target.data('lon'));
    }
    
    this.close();
  },

  show: function(textbox, recenter) {
    //Display the overlay
    this.$el.addClass('open');

    this.textbox  = textbox;
    this.recenter = recenter;

    //Get the currently cached addresses
    var data=Omg.location.cached_addresses;
    if(data.length>0)
      data=[{address:'Current Location'}].concat(data);
    else
      data=[{address:'Current Location'}];

    //Display the currently cached addresses as options
    this.$el.find('.cached-addresses-content').html(this.templateContent({ data: data }));
  },

  close: function(e) {
    if (e) { e.preventDefault(); }
    this.$el.removeClass('open');
  }

});