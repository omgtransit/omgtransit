/*
|----------------------------------------------------------------------------------------------------
| RouteCollection
|----------------------------------------------------------------------------------------------------
*/

Omg.Collections.Routes = Backbone.Collection.extend({

  url: AppConfig.realtimeUrl+"/routes",
  model: Omg.Models.Route,

  process_models: function(num_models) {
    var self = this;

    this.map(function(model) {
      model.process();
    });

    // Slice only the first five for display
    if ( num_models ) {
      this.models = this.models.slice(0,num_models);
    }
  },
  
});