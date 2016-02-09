/*
|----------------------------------------------------------------------------------------------------
| IndexView
|----------------------------------------------------------------------------------------------------
*/

Omg.Views.Index = Backbone.Marionette.ItemView.extend({
  
  template: JST['_jst/pages/index.html'],
  className: 'list-container',
  views: {},
  center: null,

  // childView: Omg.Views.ListItem,
  // childViewContainer: '#table-results',

  events: {
    'click .stopbutton': 'stopClicked',
    'click .icon-time': 'checkInClicked'
  },

  initialize: function(options) {
    var self = this;
    this.collection = new Omg.Collections.Table();

    this.listenTo(Omg.vent, 'geolocation-alert:ok:clicked', this.useDefaultLocation, this);
    this.listenTo(Omg.vent, 'app:tick', this.refresh, this);

    Omg.list_visible = true;
  },

  refresh: function() {
    var self = this;
    if(Omg.list_visible) {
      this.center = Omg.location.get('current_position');
      this.showLoading();
      this.fetch();
    }
  },

  onShow: function() {
    var self = this;
    
    // Table results
    this.table_results = this.$el.find('#table-results');

    this.networkError = this.$el.find('.alert-network');

    this.refreshContainer = $('.btn-refresh-container');
    this.refreshContainer.on('click', function() { self.refresh(); });
    this.refreshContainer.show();

    this.geolocationAlert = new Omg.Views.GeolocationAlert({ el: this.$el.find('.geolocate-alert') });

    this.rideshares = new Omg.Views.Rideshares({ el: this.$el.find('.rideshares'), collection: new Omg.Collections.Rideshares() });

    if(!this.pull_to_refresh) {
      this.pull_to_refresh = new PullToRefresh({ el: '.pull-to-refresh', scrollEl: '.table-container', offset: 50 }, function() {
        self.fetch();
      });
    }

    this.checkinOverlay = new Omg.Views.CheckinOverlay();
    console.log(this.firstViewing);
    if ( (!Omg.location.get('geolocation') && !Omg.location.get('current_position')) || !Omg.list_first_viewed ) {
      // Check for geolocation, return on success or error.
      this.updateCurrentPosition();
      Omg.list_first_viewed = true;
    } else {
      this.refresh();
    }
  },

  revive: function() {
    Omg.list_visible = true;
    if ( !_.isEqual(this.center, Omg.location.get('current_position') ) ) {
      this.refresh();
    }
    this.delegateEvents();
    if(this.rideshares) {
      this.rideshares.delegateEvents(); 
    }
  },

  updateCurrentPosition: function() {
    var self = this;
    this.geolocationAlert.$el.show();

    Omg.location.getCascadeLocation().then(function(coords) {
      self.geolocationAlert.$el.hide();
      self.refresh();
    }).fail(function(err) {
      self.geolocationAlert.error();
    });
    
  },

  useDefaultLocation: function() {
    // Geolocation must have failed, so let's start in Minneapolis, MN as a demonstration.
    Omg.location.saveItem('geolocation', AppConfig.default_center);
    Omg.location.saveItem('current_position', AppConfig.default_center);
    this.geolocationAlert.$el.hide();
    this.refresh();
  },

  fetch: function() {
    var self = this;
    if (this.center) {
      // Fetch buses, carshares, and bikeshares
      this.collection.fetch({ data: { lat: this.center.lat, lon: this.center.lon, timeout:8000, filter: Omg.filters.formatted }, 
        success: function(data) {
          self.hideLoading();
          self.tableFetched(data);
        },
        error: function() {
          self.showNetworkError();
        }
      });
    }
  },

  hideLoading: function() {
    var self = this;
    if(this.networkError) {
      this.networkError.hide();
    }

    if(this.pull_to_refresh) {
      this.pull_to_refresh.close();
    }

    if(this.refreshContainer) {
      setTimeout(function() {
        self.refreshContainer.removeClass('btn-refresh-active')
      }, 1000);
    }
  },

  showLoading: function() {
    if(this.networkError) {
      this.networkError.hide();
    }

    if(this.refreshContainer) {
      this.refreshContainer.addClass('btn-refresh-active');
    }
    if(this.pull_to_refresh) {
      this.pull_to_refresh.show();
    }
  },

  showNetworkError: function() {
    this.refreshContainer.removeClass('btn-refresh-active');
    if(this.pull_to_refresh) {
      this.pull_to_refresh.close();
    }
    this.networkError.show();
    logEvent('Error', 'event', 'Error', 'Network Error');
  },

  tableFetched: function(data) {
    var self = this;
    
    if( !this.table_results ) {
      return;
    }

    this.table_results.html( new Omg.Views.Table({ collection: data }).render().$el );

    // Process the realtime info.
    this.updateTable();

    // Update rideshares
    this.rideshares.update(this.center);
  },

  updateTable: function() {
    var self = this;

    this.$el.find(".real-time").each(function(index, item) {
      self.views[item.id] = new Omg.Views.Realtime({ el: item });
      self.views[item.id].update();
    });
  },

  getStopByIndex: function(index) {
    if ( _.isNumber(index) ) {
      return this.collection.models[0].get('stops')[index];
    }

    return null;
  },

  stopClicked: function(e) {
    e.preventDefault();

    var target = $(e.currentTarget);
    var index = target.data('index');
    
    Omg.currentStop = new Omg.Models.Stop( this.getStopByIndex(index) );
    Omg.router.navigate(target[0].hash);
  },

  checkInClicked: function(e) {
    e.stopPropagation();
    e.preventDefault();

    var target = $(e.currentTarget);
    var index = target.data('index');

    console.log('check in');
    var model = this.getStopByIndex(index);
    var realtime = this.views[model.id].collection;
    this.checkinOverlay.render( this.getStopByIndex(index), realtime );

  },

  onClose: function(){
    // custom cleanup or closing code, here
    console.log('Closing :: Omg.Views.Index');
  }

});