/*
|----------------------------------------------------------------------------------------------------
| TableView
|----------------------------------------------------------------------------------------------------
*/

Omg.Views.Ambiguity = Backbone.Marionette.ItemView.extend({
  template: JST['_jst/ambiguity.html'],
  templateContent: JST['_jst/ambiguity_contents.html'],

  className: 'overlay overlay-contentscale',
  visible: false,

  events: {
    'click .ambiguitybutton': 'ambiguityClicked',
    'click .overlay-close':   'close'
  },

  initialize: function() {
    this.listenTo(Omg.vent, 'location:geocode:ambiguity', this.show, this);
  },

  //Take a list of possible equivalents for the address along with a deferred
  //object. Once the user has selected an address (and thereby resolved the
  //ambiguity) the deferred object is used to pass the coordinates back to
  //whoever evocated the ambiguity. Note that the way in which this is constructed
  //implies that only one thing can be ambiguous at a time!
  show: function(results, deferred) {
    if (results) {
      console.log(results);
      this.$el.find('nav').html( this.templateContent({ data: results }) );
      this.$el.addClass('open');
      this.deferred=deferred;
    } else {
      deferred.reject();
    }
    
  },

  close: function(e) {
    if (e) { e.preventDefault(); }
    this.$el.removeClass('open');
  },

  ambiguityClicked: function(e) {
    var target = $(e.currentTarget);
    this.$el.removeClass('open');
    var ret={address:target.data('address'), lat:target.data('lat'), lon:target.data('lon')};
    Omg.location.cacheAddressAndLocation(target.data('address'), target.data('lat'), target.data('lon'));
    this.deferred.resolve(ret);
    this.deferred=false;
  }
});