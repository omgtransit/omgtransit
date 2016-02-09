/*
|----------------------------------------------------------------------------------------------------
| SidecarModel
|----------------------------------------------------------------------------------------------------
*/

Omg.Models.Sidecar = Backbone.Model.extend({
  urlRoot: AppConfig.realtimeUrl + '/rideshare/sidecar/',

  url: function() {
    var center = Omg.location.get('geocenter');
    if(!center) {
      return false; 
    }

    return this.urlRoot + center.lat + '/' + center.lon;
  }
});