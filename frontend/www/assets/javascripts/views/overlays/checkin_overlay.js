Omg.Views.CheckinOverlay = Backbone.View.extend({
  template:  JST['_jst/overlays/checkin.html'],
  className: 'overlay',

  events: {
    'click .overlay-close': 'close'
  },

  render: function(model, realtime) {
    this.$el.html( this.template({ model: model, realtime: realtime }) );
    $('body').prepend( this.$el );
    
    this.delegateEvents();
  },

  close: function() {
    console.log("Close");
    this.$el.remove();
  }
});