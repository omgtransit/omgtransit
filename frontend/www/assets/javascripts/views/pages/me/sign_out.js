/*
|----------------------------------------------------------------------------------------------------
| SignOut
|----------------------------------------------------------------------------------------------------
*/

Omg.Views.SignOut = Backbone.Marionette.ItemView.extend({
  template: JST['_jst/pages/signout.html'],
  className: 'signout-container container',

  onShow: function() {
    Omg.user.logout();
  }

});