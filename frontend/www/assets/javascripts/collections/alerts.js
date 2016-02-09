/*
|----------------------------------------------------------------------------------------------------
| AlertsCollection
|----------------------------------------------------------------------------------------------------
*/

Omg.Collections.Alerts = Backbone.Collection.extend({
  url: AppConfig.backendUrl + "/alert?format=json",
  model: Omg.Models.Alert
});