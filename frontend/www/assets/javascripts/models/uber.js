/*
|----------------------------------------------------------------------------------------------------
| SidecarModel
|----------------------------------------------------------------------------------------------------
*/

Omg.Models.Uber = Backbone.Model.extend({
  urlRoot: AppConfig.realtimeUrl + '/uber/time/',

  url: function() {
    var center = Omg.location.get('geocenter');
    if(!center) {
      return false; 
    }

    return this.urlRoot + center.lat + '/' + center.lon;
  }
});