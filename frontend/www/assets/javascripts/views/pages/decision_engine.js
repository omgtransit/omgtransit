/*
|----------------------------------------------------------------------------------------------------
| Decision Engine
|----------------------------------------------------------------------------------------------------
*/

Omg.Views.DecisionEngine = Backbone.Marionette.ItemView.extend({
  
  template: JST['_jst/decision_engine.html'],
  templateResults: JST['_jst/decision_engine_results.html'],

  events: {
    'click #btn-route':    'route',
    'click .btn-exchange': 'exchange',
    'click .loc-arrow':    'clicked_bookmark_button',
    'click .start-nav':    'startNavigation'
  },

  initialize: function(options) {
    var self = this;
  },

  clicked_bookmark_button: function(e){
    if(e) { e.preventDefault(); }
    var target         = $(e.currentTarget);
    var textbox_to_set = '#'+$(target).data('input');
    Omg.vent.trigger('location:choose_cached', this.$el.find(textbox_to_set), false);
  },

  route: function(){
    var self=this;
    console.log('Clicking');

    if(this.$el.find('#btn-route').hasClass('disabled'))
      return;

    //Get specified address from textboxes
    var origin      = this.$el.find('#origin').val();
    var destination = this.$el.find('#destination').val();

    self.thinking();

    //Convert addresses to Geolocations
    Omg.location.convertAddressToGeolocation(origin).then(function(originLoc){
      Omg.location.convertAddressToGeolocation(destination).then(function(destinationLoc){
        var start_time  = moment().format();

        //Convert geolocations to strings suitable for passing to server
        var originlatlon = originLoc.lat+','+originLoc.lon;
        var destlatlon   = destinationLoc.lat+','+destinationLoc.lon;

        //Replace textboxes with prettified addresses
        self.$el.find('#origin').val(originLoc.address);
        self.$el.find('#destination').val(destinationLoc.address);

        console.log('Calling server');
        $.ajax(AppConfig.realtimeUrl+'/deceng/'+originlatlon+'/'+destlatlon+'/transit,car2go,bicycling,walking,driving/'+start_time,
          {
            dataType: 'json',
            timeout:  30*1000 //30 second timeout            
          })
         .done(self.gotdata.bind(self))
         .fail(function(err){
            self.donethinking();
            Omg.vent.trigger('message:error','Failed to connect to decision engine!');
            console.log('Failed to get decision engine err: ',info);
          //TODO(Richard): Inform the user
         });
      }).fail(function(err){
        self.donethinking();
        Omg.vent.trigger('message:error','Could not find your destination location!');
        console.log('Failed to geocode destination address: ',err);
        //TODO(Richard): Post an alert to the user
      });
    }).fail(function(err){
      self.donethinking();
      Omg.vent.trigger('message:error','Could not find your start location!');
      console.log('Failed to geocode origin address: ',err);
      //TODO(Richard): Post an alert to the user
    });
  },

  thinking: function(){
    this.$el.find('#btn-route').addClass('disabled');
    Omg.vent.trigger('message:thinking');
  },

  donethinking: function(){
    this.$el.find('#btn-route').removeClass('disabled');
    Omg.vent.trigger('message:donethinking');
  },

  gotdata: function(data){
    this.donethinking();
    this.$el.find('#deceng_results').html(this.templateResults({data:data}));
    
    $('html, body').animate({
        scrollTop: parseInt($(".deng-weather").offset().top) - 50
    }, 500);
  },

  exchange: function(){
    var origin    = this.$el.find('#origin');
    var dest      = this.$el.find('#destination');
    var originval = origin.val();
    origin.val(dest.val());
    dest.val(originval);
  },

  onClose: function(){
    // custom cleanup or closing code, here
    console.log('Closing :: Omg.Views.DecisionEngine');
    Omg.vent.trigger('message:donethinking');
  },

  startNavigation: function(e) {
    var target = $(e.currentTarget);
    var index = target.data('index');
    console.log('start');

    this.$el.find('.navigation-legs').html( target.prev('.de-legs').removeClass('hide') );
    this.$el.find('.navigation-legs').prepend( target.parent().find('.de-option-header') );
    this.$el.find('.interface').hide();
    this.$el.find('#navigation').css({'opacity': 1, 'visibility': 'visible'});

    this.setupRoute(index);
  },

  setupRoute: function(index) {
    console.log(deResults[index]);
    this.drawPolylines(index);
  },

  drawPolylines: function(index) {
    var option = deResults[index];

    //for( var i=0; i < option.length; i++ ) {
      this.addPath(option[0].overview_polyline.points);
    //}



  },

  addPath: function(path) {
    // var decodedSets = google.maps.geometry.encoding.decodePath(path);
    // var path = this.poly.getPath();
    // path.push(decodedSets);
    var decodedSets = google.maps.geometry.encoding.decodePath(path); 
    this.poly.setPath(decodedSets);
    this.poly.setMap(this.map);
  }

});