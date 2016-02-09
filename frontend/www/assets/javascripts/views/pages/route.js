/*
|----------------------------------------------------------------------------------------------------
| TableView
|----------------------------------------------------------------------------------------------------
*/

Omg.Views.Route = Backbone.Marionette.ItemView.extend({
  template: JST['_jst/view_route.html'],
  id: 'view-route',

  initialize: function(){
    _.bindAll(this);

    this.listenTo(Omg.vent, 'location:updated_coordinates', this.changeCoordinates, this);

    this.collection = new Omg.Collections.Routes();
    this.loadCollection();
  },

  loadCollection: function() {
    var self = this;
    
    //if(Omg.list_visible) {
      this.center = Omg.location.get('geocenter');
      //this.showLoading();
      this.fetch();
    //}
  },

  fetch: function() {
    var self = this;
    if (this.center) {
      this.collection.fetch({ data: { lat: this.center.lat, lon: this.center.lon, timeout:8000},
        success: function(data) {
          //self.loading.hide();
          self.collection.process_models(10);
          self.routesFetched(data);
        },
        error: function() {
          Omg.vent.trigger('message:error','Network error: could not get routes!');
        }
      });  
    } else {
      Omg.vent.trigger('message:error','Please refresh your geolocation!')
    }
  },

  routesFetched: function(data){
    console.log(data);
    this.$el.find('#view-route-results').html( new Omg.Views.RouteResults({ collection: data }).render().$el );
    this.$el.find('#view-route-results').show();
    console.log(this.$el.find('#view-route-results'));
  },

  onClose: function() {
    // custom cleanup or closing code, here
    console.log('closing :: Omg.Views.Route');
  }
});