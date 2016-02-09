/*
|----------------------------------------------------------------------------------------------------
| HalioModel
|----------------------------------------------------------------------------------------------------
*/

Omg.Models.Hailo = Backbone.Model.extend({
  urlRoot: AppConfig.realtimeUrl + '/rideshare/halio/',

  url: function() {
    var center = Omg.location.get('geocenter');
    if(!center) {
      return false; 
    }

    return this.urlRoot + center.lat + '/' + center.lon;
  }
});