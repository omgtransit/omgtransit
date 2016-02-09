/*
|----------------------------------------------------------------------------------------------------
| FavoritesCollection
|----------------------------------------------------------------------------------------------------
*/

Omg.Collections.Favorites = Backbone.Collection.extend({
  url: AppConfig.backendUrl + "/favorite?format=json"
});