/*
|----------------------------------------------------------------------------------------------------
| RealTimeView
|----------------------------------------------------------------------------------------------------
*/

Omg.Views.Realtime = Backbone.View.extend({

  metro_bus_template:         JST['_jst/tbl_bus.html'],
  train_template:             JST['_jst/tbl_train.html'],
  bikeshare_station_template: JST['_jst/tbl_bikeshare_station.html'],
  car2go_template:            JST['_jst/tbl_car2go.html'],
  zipcar_template:            JST['_jst/tbl_zipcar.html'],
  airport_template:           JST['_jst/tbl_airport.html'],
  metro_train_template:       JST['_jst/tbl_bus.html'],
  intercity_train_template:   JST['_jst/tbl_bus.html'],
  hourcar_template:           JST['_jst/tbl_hourcar.html'],
  
  initialize: function(args) {
    _.bindAll(this);

    //TODO(Richard): Try to find a way to avoid parsing the data off of the element. That seems horrifically indirect.
    if(typeof(args.stop)!=="undefined"){
      this.stop = args.stop;
    } else {
      this.stop = this.$el.data('stopdata');
    }

    if ( args.map_stop ) {
      this.$el=$('<span></span>');
      this.$el.data('name',args.stop.stop_name);
      this.map_stop=true;
    } else {
      this.loading_image=this.$el.find('.loadingimg');
      this.map_stop=false;
    }

    if ( args.showBlankStops ) {
      this.showBlankStops = true;
    }

    this.collection              = new Omg.Collections.BusETA();
    this.collection.stop_id      = this.stop.id;
    this.collection.realtime_url = this.setupUrl(this.stop.stop_url);
    this.collection.stop_type    = this.stop.stop_type;
    this.collection.source_id    = this.stop.source_id;
    this.collection.parser       = this.stop.stop_type;
    this.collection.logo         = this.stop.stop_type;
   
    if ( !this.$el.find('.collection').length ) {
      this.$el.append('<div class="collection"></div>');
    }

  },

  setupUrl: function(url) {
    url = url.replace('callback=?', '');
    return AppConfig.realtimeUrl + '/' + url;
  },

  render: function(collection) {
    if ( collection.length === 0 && !this.map_stop ) {
      if( this.showBlankStops ) {
        this.$el.html('<div class="label route-chip pnd">No Data</div>');  
      } else {
        this.$el.parent().parent().hide()
      }
      
    } else {
      if(!this.map_stop) this.loading_image.hide();
      this.$el.find('.collection').html(this[collection.stop_type+'_template']({ logo: collection.logo , data: collection.toJSON() }));
    }
  },

  update: function(callback, skip_fetch, err_callback) {
    var self = this;
    if( !skip_fetch && this.collection.length === 0 ) {        
      this.collection.fetch({
        success: function(collection) {
          self.process_data(collection, 5);
          if(callback) { callback(); }
        },
        error: function() {
          if(err_callback) { err_callback(); }
        }
      });
    } else {
      if(callback) { callback(); }
    }
    
  },

  process_data: function(collection, num_models) {   
    collection.process_models(num_models);
    this.render(collection);
  }
});