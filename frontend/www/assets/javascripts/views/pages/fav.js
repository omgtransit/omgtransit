/*
|----------------------------------------------------------------------------------------------------
| IndexView
|----------------------------------------------------------------------------------------------------
*/

Omg.Views.Fav = Backbone.Marionette.ItemView.extend({
  className: 'favorites-container',
  template: JST['_jst/pages/fav.html'],
  favlistTemplate: JST['_jst/favlist.html'],
  views: {},

  events: {
    'click .trashstop': 'deleteFavorite',
    'click .favortite-stop': 'gotoStop',
    'click .btn-refresh': 'refresh'
  },

  initialize: function() {
    this.favorites = new Omg.Collections.Favorites();
    this.favorite = new Omg.Models.Favorite();
  },

  onRender: function() {
    this.update();
    this.$el.find('.fav-error-alert').hide();
  },

  refresh: function() {
    var self = this;

    this.showLoading();
    this.updateTable();
    
    setTimeout(function() {
      self.hideLoading();
    }, 700);
  },

  update: function() {
    var self = this;

    if ( Omg.user.signedIn ) {
      this.showLoading();

      this.favorites.fetch({ 
        data: {
          user_email: Omg.user.get('email'),
          user_token: Omg.user.get('auth_token')
        },
        success: function() {
          self.addFavorites();
          if ( self.favorites.size() > 0 ) {
            self.updateTable();
          }
          self.hideLoading();
        }, error: function() {

        }
      });
    }
  },

  showLoading: function() {
    this.$el.find('.fav-loading').show();
  },

  hideLoading: function() {
    this.$el.find('.fav-loading').hide();
  },

  addFavorites: function() {
    this.$el.find('#table-results').html( this.favlistTemplate({ stops: this.favorites }) );
  },

  deleteFavorite: function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    var parent = $(e.currentTarget).parent();
    var stopid = parent.data("id");
    
    parent.hide();

    this.favorite.set('id', stopid);
    this.favorite.destroy();
  },

  updateTable: function() {
    var self = this;

    this.$el.find(".real-time").each(function(index, item) {
      self.views[item.id] = new Omg.Views.Realtime({ el: item, showBlankStops: true });
      self.views[item.id].update();
    });
  },

  showSignIn: function(e) {
    e.preventDefault();
    Omg.vent.trigger('login:show');
  },

  showSignUp: function(e) {
    e.preventDefault();
    Omg.vent.trigger('signup:show');
  },

  gotoStop: function(e) {
    e.preventDefault();

    var target = $(e.currentTarget);
    
    Omg.currentStop = null;
    Omg.router.navigate(target[0].hash);
  },

  onClose: function(){
    // custom cleanup or closing code, here
    console.log('closing :: favorite view');
  }

});