/*
|----------------------------------------------------------------------------------------------------
| StopModel
|----------------------------------------------------------------------------------------------------
*/

Omg.Models.Stop = Backbone.Model.extend({
  urlRoot: AppConfig.realtimeUrl + '/stop/',

  url: function() {
    return this.urlRoot + this.get('source')  + '/' + this.get('id');
  },

  defaults: {
    id : ''
  }
});