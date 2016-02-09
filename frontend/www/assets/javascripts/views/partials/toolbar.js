/*
|----------------------------------------------------------------------------------------------------
| Toolbar View
|----------------------------------------------------------------------------------------------------
*/

Omg.Views.Toolbar = Backbone.Marionette.ItemView.extend({
  template: JST['_jst/partials/toolbar.html'],

  events: {},

  initialize: function() {
    this.listenTo(Omg.vent, 'route:changed', this.routeChanged, this);
  },
  
  routeChanged: function(name) {
    if(this.active) {
      this.active.removeClass('active');
    }

    this.active = this.$el.find('.' + name);
    this.active.addClass('active');
  }

});