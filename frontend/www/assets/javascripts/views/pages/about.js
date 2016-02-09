/*
|----------------------------------------------------------------------------------------------------
| AboutView
|----------------------------------------------------------------------------------------------------
*/

Omg.Views.About = Backbone.Marionette.ItemView.extend({
  template: JST['_jst/pages/about.html'],
  id: 'view-about',

  events: {
    'click a.login': 'login',
  },

  login: function(e){
    if(e) { e.preventDefault(); }
    Omg.vent.trigger('login:show');
  },

  onClose: function(){
    // custom cleanup or closing code, here
    console.log('closing :: Omg.Views.About');
  }

});