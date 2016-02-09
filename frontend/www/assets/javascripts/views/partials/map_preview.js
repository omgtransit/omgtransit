/*
|----------------------------------------------------------------------------------------------------
| TableView
|----------------------------------------------------------------------------------------------------
*/

Omg.Views.MapPreview = Backbone.Marionette.ItemView.extend({
  
  views: {},
  map_center: {},
  viewStates: {
    BASE:    'base',
    PREVIEW: 'preview',
    LIST:    'list',
    DETAIL:  'detail'
  },
  currentViewState: 'base',
  expanded:         false,

  list:    false,
  preview: false,
  detail:  false,

  el: '#map-preview',

  events: {
    'click .btn-alert':         'alertClicked',
    'click .btn-list':          'listClicked',
    'click #view-stop-preview': 'hudClicked',
    'click .detail-back':       'backClicked',
    'click .car2go-reserve-container': 'car2goReserveClicked'
  },

  initialize: function() {
    var self = this;
    
    this.btn_list = this.$el.find('.btn-list');

    //this.table_view      = this.$el.find('#view-table');
    this.table_results   = this.$el.find('#table-results');
    this.tableCollection = new Omg.Collections.Table();

    this.stop_detail_view = this.$el.find('#view-stop-detail');
    this.stopPreviewView  = new Omg.Views.StopPreview();

    this.listenTo(Omg.vent, 'app:tick', this.tick, this);

    // Swipe up.
    // Hammer(this.$el[0]).on("swipeup", function(event) {
    //   self.hudClicked();
    // });
  },

  tick: function() {
    if( this.preview ) {
      this.stopPreviewView.update();
    }
  },

  setCenter: function(center) {
    var self = this;
    this.map_center = center;
    
    if ( this.currentViewState === this.viewStates.LIST ) {
      this.fetchTable();
    }
  },

  hudClicked: function(e) {
    if(e) { e.preventDefault(); }

    // Setup stop model since it's already been fetched!
    Omg.currentStop = new Omg.Models.Stop( this.stop );
    Omg.router.navigate('#/stop/' + this.stop.stop_url.toUpperCase());
    
    this.$el.hide();
  },

  car2goReserveClicked: function(e) {
    e.preventDefault();
    e.stopPropagation();

    Omg.car2go.reserve_click(e);
  },

  backClicked: function(e) {
    if(e) { e.preventDefault(); e.stopPropagation(); }

    if ( this.currentViewState === this.viewStates.LIST ) {
      this.table_view.show();
      this.list = true;
      this.currentViewState = this.viewStates.LIST;
    } else if ( this.currentViewState === this.viewStates.PREVIEW ) {
      this.retract();
    }

    this.stopList.$el.hide();
  },

  alertClicked: function(e) {
    if(e) { e.preventDefault(); }

    var i = $(e.currentTarget).data('index'),
        model = this.stopList.collection.at(i),
        stopModel = new Omg.Models.Stop(this.stop);
    
    Omg.vent.trigger('alert:show', {
      route:              model.get('Route'),
      stopName:           stopModel.get('stop_name'),
      alertTime:          model.getTimeFormatted('HH:mm'),
      alertTimeFormatted: model.getTimeFormatted('h:mm a'),
      stopModel:          stopModel,
      model:              model
    });

  },

  setHudButton: function(list) {
    this.list = list;
    if ( this.list ) {
      this.btn_list.html('<i class="icon-omg-map"></i>Map');
      if( this.preview ) {
        this.hide();
      }
    } else {
      this.btn_list.html('<i class="icon-omg-list"></i>List');
    }

    //this.$el.show();
  },

  route: function() {
    if ( this.list ) {
      Omg.router.navigate('#/map');
    } else {
      Omg.router.navigate('#/list');

      if( this.preview ) {
        this.hide();
      }
    }
  },

  listClicked: function(e) {
    if(e) { e.preventDefault(); e.stopPropagation(); }

    this.route();
    this.setHudButton(this.list);
  },

  tableFetched: function(data) {
    
    this.table_results.html( new Omg.Views.Table({ collection: data }).render().$el );
    this.table_view.show();

    // Process the realtime info.
    this.updateTable();
  },

  updateTable: function() {
    var self = this;
    
    this.views = [];
    this.$el.find(".real-time").each(function(index, item) {
      self.views[item.id] = new Omg.Views.Realtime({ el: item });
      self.views[item.id].update();
    });
  },

  resetToListButton: function() {
    this.$el.find('.view').hide();
    this.btn_list.show();
    this.preview = false;
    this.list    = false;

    this.$el.css('overflow-y','hidden');

    this.currentViewState = this.viewStates.BASE;
  },

  resetToPreview: function() {
    this.preview = true;
    this.currentViewState = this.viewStates.PREVIEW;
  },

  expand: function() {
    this.$el.addClass('expanded');
    this.expanded = true;
    this.preview  = false;

    var h = window.innerHeight * 0.25;
    var translate = 'translateZ(0) translateY(-' + h + 'px)';

    $('#map-canvas').css({'webkitTransform': translate });
  },

  retract: function() {
    this.$el.removeClass('expanded');
    this.expanded = false;
    this.determineRetractState();

    $('#map-canvas').css({'webkitTransform': 'translateZ(0) translateY(0)' });
  },

  determineRetractState: function() {

    if ( this.currentViewState === this.viewStates.LIST ) {
      // If list was previously showing, retract to the "list" button
      this.resetToListButton();
    } else if ( this.currentViewState === this.viewStates.PREVIEW ) {
      // If preview was previously showing, reset to preview view.
      this.resetToPreview();
      this.stopPreviewView.show();
      this.favoriteView.getFavorite();
    }

    // Is the detail screen currently showing?
    if( this.detail ) {
      this.stopList.$el.hide();
    }
    this.detail = false;
    this.list   = false;
  },

  showPreview: function(){
    this.preview = true;
    this.detail  = false;
    this.list    = false;
    this.currentViewState = this.viewStates.PREVIEW;
    this.stopPreviewView.show();
  },

  setPreview: function(view, stop) {
    this.stopPreviewView.change(view,stop);
    //this.btn_list.hide();

    this.stop = stop;
    this.favoriteView = new Omg.Views.Favorite({ stop_id: stop.id});
  },

  showNetworkError: function() {
    Omg.vent.trigger('message:error','Ruh oh! There was a network error.');
  },

  hide: function() {
    this.preview = false;
    this.stopPreviewView.hide();
  }/*,

  reload: function(hud_html, stop) {
    var self = this;
    self.setPreview(hud_html, stop)
  }*/

});