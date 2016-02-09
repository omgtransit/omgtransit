/*
|----------------------------------------------------------------------------------------------------
| HelpView
|----------------------------------------------------------------------------------------------------
*/

Omg.Views.Help = Backbone.Marionette.ItemView.extend({
  template: JST['_jst/help.html'],
  id: 'view-help',

  onClose: function(){
    // custom cleanup or closing code, here
    console.log('closing :: Omg.Views.Help');
  }

});