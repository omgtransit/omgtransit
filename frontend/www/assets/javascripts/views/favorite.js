/*
|----------------------------------------------------------------------------------------------------
| FavoritesView
|----------------------------------------------------------------------------------------------------
*/

Omg.Views.Favorite = Backbone.View.extend({
  
  el: '#makefav',
  favs: null,
  is_fav: false,

  initialize: function(arguments) {
    _.bindAll(this);
    this.stopid = arguments.stop_id;
    this.model = new Omg.Models.Favorite({ id: this.stopid });

    this.getFavorite();    
  },

  getFavorite: function() {
    if( Omg.user.signedIn ) {
      this.model.fetch({ success: this.process_favorite });
    }
    this.$el.on('click', this.togglefav);
  },

  process_favorite: function() {
    if ( this.model.hasChanged('stop_id') ) {
      this.activate();
    } else {
      this.clear_model();
    }
  },

  activate: function() {
    this.is_fav = true;
    this.$el.find('i').addClass('star-yellow');
  },

  deactivate: function() {
    this.is_fav = false;
    this.$el.find('i').removeClass('star-yellow');
  },

  clear_model: function() {
    this.model.set('id', null);
    this.model.set('stop_id', this.stopid);
  },

  togglefav: function (e) {
    console.log('toggle fav');
    e.preventDefault();
    e.stopImmediatePropagation();

    if( Omg.user.signedIn ) {
      if ( this.is_fav ) {
        this.deactivate();
        this.model.set('id', this.stopid);
        this.model.destroy();
        this.clear_model();
      } else {
        this.activate();
        this.model.save();
        logEvent('Click', 'event', 'Favorites', 'Favorite Star');
      }
    } else {
      Alert.show('You must be signed in to add favorites!', 'Oops', 'Ok');
    }

  }

});