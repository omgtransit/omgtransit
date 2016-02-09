/*
|----------------------------------------------------------------------------------------------------
| LegalView
|----------------------------------------------------------------------------------------------------
*/

Omg.Views.Legal = Backbone.Marionette.ItemView.extend({
  template: JST['_jst/legal.html'],
  id: 'view-legal',

  onClose: function(){
    // custom cleanup or closing code, here
    console.log('closing :: Omg.Views.Notes');
  }

});