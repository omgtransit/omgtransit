/*
|----------------------------------------------------------------------------------------------------
| BusETACollection
|----------------------------------------------------------------------------------------------------
*/

Omg.Collections.BusETA = Backbone.Collection.extend({

  stop_id: null,
  model: Omg.Models.BusETA,

  initialize: function(arguments){
    if(typeof(arguments)==="undefined" || typeof(arguments.stop)==="undefined"){
      //console.log('Deprecated(RB,bus_eta.js): BusETACollection initialized using deprecated method.');
      return;
    }

    this.stop_id      = arguments.stop.stop_id;
    this.realtime_url = arguments.stop.realtime_url;
    this.stop_type    = arguments.stop.stop_type;
    this.source_id    = arguments.stop.source_id;
    this.format       = arguments.stop.format;
    this.parser       = arguments.stop.parser;
    this.logo         = arguments.stop.logo;
  },
  
  url: function() {
    return this.realtime_url;
  },

  process_models: function(num_models) {
    var self = this;

    // Process the times for sorting purposes.
    if ( this.callback ) {
      this.map(function(model) {
        model[self.callback]();
      });

      // Sort models by closest
      if ( this.models.length > 1 ) {
        this.models = this.sortBy(function(model) { return model.get('DepartureTime'); });
      }

      
      // Slice only the first five for display
      if ( num_models ) {
        this.models = this.models.slice(0,num_models);
      }
    }
  },

  parse: function( response ) {
    this.callback = response.callback;

    return response.content;
  }

});