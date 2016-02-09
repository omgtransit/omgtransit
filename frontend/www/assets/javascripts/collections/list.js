/*
|----------------------------------------------------------------------------------------------------
| TableCollection
|----------------------------------------------------------------------------------------------------
*/

Omg.Collections.List = Backbone.Collection.extend({
  url: AppConfig.realtimeUrl + "/table",
  model: Omg.Models.Stop,

  parse: function(resp, xhr) {
    this.nearby_stops = resp.nearby_stops;
    return resp.stops.slice(0,10);
  }
});