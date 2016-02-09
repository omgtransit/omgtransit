/*
|----------------------------------------------------------------------------------------------------
| NewsView
|----------------------------------------------------------------------------------------------------
*/

Omg.Views.News = Backbone.Marionette.ItemView.extend({
  template: JST['_jst/news.html'],
  id:       'view-news',

  events: {},

  onClose: function(){
    // custom cleanup or closing code, here
    console.log('closing :: Omg.Views.News');
  }

});