/*
|----------------------------------------------------------------------------------------------------
| NotesView
|----------------------------------------------------------------------------------------------------
*/

Omg.Views.Notes = Backbone.Marionette.ItemView.extend({
  template: JST['_jst/notes.html'],
  id:       'view-notes',

  onClose: function(){
    // custom cleanup or closing code, here
    console.log('closing :: Omg.Views.Notes');
  }

});