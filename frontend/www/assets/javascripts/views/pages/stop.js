/*
|----------------------------------------------------------------------------------------------------
| StopView
|----------------------------------------------------------------------------------------------------
*/

Omg.Views.Stop = Backbone.Marionette.ItemView.extend({
  
  template:      JST['_jst/partials/stop_loading.html'],
  stop_template: JST['_jst/pages/stop.html'],
  className:     'stop-container',

  events: {
    'click #mapshow':         'showMap',
    'click #mapmodal':        'hideMap',
    'click .btn-alert':       'alertClicked',
    'click #wrap-detail-map': 'mapClicked',
    'click .btn-refresh-container': 'refresh'
  },

  initialize: function() {
    var self = this;
    if( !Omg.currentStop ) { // Check the id.
      this.model.fetch({ data: { format: 'json' }, type: 'GET' });
    } else {
      setTimeout(function() {
        self.model = Omg.currentStop;
        self.updateStop();
      }, 200);
    }

    this.listenTo(Omg.vent, 'user:logged_in', this.loggedIn, this);
    this.listenTo(Omg.vent, 'user:logged_out', this.loggedOut, this);
    this.listenTo(this.model, "change", this.updateStop);
  },

  refresh: function() {
    if(this.detailView) {
      this.detailView.update();
    }
    // if(this.pull_to_refresh) {
    //   this.pull_to_refresh.close();
    // }
  },

  updateStop: function() {
    this.$el.html( this.stop_template(this.model) );

    // if(this.pull_to_refresh) {
    //   this.pull_to_refresh.destroy();
    // }

    // this.pull_to_refresh = new PullToRefresh({ el: '.pull-to-refresh', scrollEl: '.stop-content', offset: 50 }, function() {
    //   self.refresh();
    // });

    //This line fires the request for real-time data
    this.detailView = new Omg.Views.StopViewDetail({stop:this.model.attributes});
    this.detailView.update();

    //this.favoriteView = new Omg.Views.Favorite({ stop_id: this.model.attributes.id});

    var self = this;
    var map_options = {
      center:            new google.maps.LatLng(this.detailView.stop.location.lat, this.detailView.stop.location.lon),
      zoom:              16,
      mapTypeId:         google.maps.MapTypeId.ROADMAP,
      panControl:        false,
      mapTypeControl:    false,
      zoomControl:       false,
      streetViewControl: false,
      scaleControl:      false,
      draggable:         false
    };

    setTimeout(function() {
      var stop_type=self.detailView.stop.stop_type;
      var icon = AppConfig.transit_mode_icons[stop_type];

      self.map = new google.maps.Map(document.getElementById("detail-map"), map_options);
      var marker = new google.maps.Marker({
        position:  new google.maps.LatLng(self.detailView.stop.location.lat, self.detailView.stop.location.lon),
        map:       self.map,
        draggable: false,
        icon:      icon.gicon,
        animation: google.maps.Animation.DROP,
        zIndex:    1
      });

    }, 200);
  },

  mapClicked: function(e) {
    var self = this;
    e.preventDefault();
    Omg.router.navigate('#/map');
    setTimeout(function() {
      Omg.vent.trigger('map:select_stop', self.detailView.stop.id);
    }, 700);
    
  },

  loggedIn: function() {
    this.$el.find('#makefav').show();
    if(this.favoriteView) {
      if ( !this.favoriteView.is_fav ) {
        this.favoriteView.getFavorite();
      }
    }
    
    if(this.detailView) {
      this.detailView.update();
    }
  },

  loggedOut: function() {
    this.$el.find('#makefav').hide();
  },

  showMap: function() {
    $("#mapmodal").modal('show');
  },

  hideMap: function() {
    $("#mapmodal").modal('hide');
  },

  alertClicked: function(e) {
    if(e) { e.preventDefault(); }

    var i = $(e.currentTarget).data('index'),
        model = this.detailView.collection.at(i);
        
    Omg.vent.trigger('alert:show', {
      route:              model.get('route'),
      stopName:           this.model.get('stop_name'),
      alertTime:          model.getTimeFormatted('HH:mm'),
      alertTimeFormatted: model.getTimeFormatted('h:mm a'),
      stopModel:          this.model,
      model:              model
    });
  
    logEvent('Click', 'event', 'Alerts', 'Alert Bell');    
  },

  onClose: function(){
    // custom cleanup or closing code, here
    console.log('closing :: stop view');
    this.$el.off('click', '#mapshow');
    this.$el.off('click', '#mapmodal');
  }

});