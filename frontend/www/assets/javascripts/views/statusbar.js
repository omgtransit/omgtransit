/*
|----------------------------------------------------------------------------------------------------
| SignupView
|----------------------------------------------------------------------------------------------------
*/

Omg.Views.Statusbar = Backbone.Marionette.ItemView.extend({
  template:  JST['_jst/statusbar.html'],
  visible:   false,

  events: {
    'click #statusbar-close': 'hideMessage',
    'click .carinfo':         'showCar',
    'click .trash':           'car2go_cancel'
  },

  initialize: function() {
    var self=this;
    //Indicates whether or not the user has dismissed the current status message
    self.seen_motd = true;

    //TODO(Richard): Probably need to delay this a moment to ensure that the
    //Car2go info is loaded
    if(typeof(Omg.car2go.get('address'))!=="undefined")
      this.car2go_updated();

    this.listenTo(Omg.vent, 'car2go:updated',  this.car2go_updated,  this);
    this.listenTo(Omg.vent, 'car2go:canceled', this.car2go_canceled, this);
    this.listenTo(Omg.vent, 'app:ready', this.appReady, this);
  },

  hideMessage: function(e) {
    if (e) e.preventDefault();

    this.seen_motd = true;
    this.hide();

    localStorage['statusbar_dismiss_id'] = this.statusbar_id;
  },

  appReady: function() {
    var self=this;
    
    $.getJSON(AppConfig.backendUrl + "/v1/statusbar-message",{ platform: Omg.device },function(data, status){
      self.statusbar_dismiss=localStorage.getItem('statusbar_dismiss_id');

      if(data.message.length!=0 && (self.statusbar_dismiss === null || self.statusbar_dismiss!=data.id)) {
        self.$el.find('#statusbar-message').html(data.message);
        self.statusbar_id=data.id;
        self.seen_motd = false;
        self.show();
      }
    });
  },

  show: function() {
    this.$el.parent().show();
  },

  hide: function() {
    this.$el.parent().hide();
  },

  car2go_updated: function() {
    this.$el.find('.message').hide();
    this.$el.find('.car2go').show();

    //Get address and use only the first part of it (drop the city and zip code)
    var address=Omg.car2go.get('address');
    address=address.substr(0,address.indexOf(','));

    //Get license plate info
    var license=Omg.car2go.get('licenseplate');
    this.$el.find('.carinfo').html(address+' ('+license+')');
    this.show();
  },

  car2go_canceled: function() {
    if(this.seen_motd){
      this.hide();
    } else {
      this.$el.find('.car2go').hide();
      this.$el.find('.message').show();
    }
  },

  showCar: function() {
    Omg.vent.trigger('map:pan', Omg.car2go.get('lat'), Omg.car2go.get('lon'));
  },

  car2go_cancel: function(e) {
    if (e) e.preventDefault();
    Omg.vent.trigger('car2go:cancel');
  }

});