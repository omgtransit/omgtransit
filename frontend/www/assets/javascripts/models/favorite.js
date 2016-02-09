/*
|----------------------------------------------------------------------------------------------------
| FavoriteModel
|----------------------------------------------------------------------------------------------------
*/

Omg.Models.Favorite = Backbone.Model.extend({
  urlRoot: AppConfig.backendUrl + '/favorite',
  url: function() {
    var id = this.get('id');
    if (id) {
      return AppConfig.backendUrl + '/favorite/' + this.get('id') + '?user_email=' + Omg.user.get('email') + '&user_token=' + Omg.user.get('auth_token')
    } else {
      return AppConfig.backendUrl + '/favorite/?user_email=' + Omg.user.get('email') + '&user_token=' + Omg.user.get('auth_token')
    }
  }
});