/*
|----------------------------------------------------------------------------------------------------
| MobileAppsView
|----------------------------------------------------------------------------------------------------
*/

Omg.Views.MobileApps = Backbone.Marionette.ItemView.extend({
  template: JST['_jst/mobile.html'],
  id:       'view-mobile-apps',

  events: {},

  onClose: function(){
    // custom cleanup or closing code, here
    console.log('closing :: Omg.Views.MobileApps');
  }

});