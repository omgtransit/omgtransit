/*
|----------------------------------------------------------------------------------------------------
| AppLayout
|----------------------------------------------------------------------------------------------------
*/

Omg.Layouts.Application = Backbone.Marionette.LayoutView.extend({
  className: 'layout',
  template: JST['_jst/application.html'],

  regions: {
    navbar: '#navbar',
    toolbar: '#toolbar',
    content: '#content',
    ambiguity: '#ambiguity',
    destinationLocation: '#destination-location',
    login:           '#login',
    alertOverlay:    '#alert-overlay',
    cachedAddresses: '#cached-addresses-overlay',
    car2go_reg:      '#car2go_reg',
    statusbar:       '#statusbar-container',
  },

  initialize: function() {
    //this.createViews();
  },

  // createViews: function() {
  //   this.views = {
  //     list: new Omg.Views.Index(),
  //     map: new Omg.Views.Map()
  //   };
  // },

  // showItemView: function (name) {
  //   var view = this.views[name];
  //   console.log(view);
  //   if (this.content.currentView) {

  //     // Detach previous view.
  //     this.content.currentView.$el.detach();

  //     // Append new view from cache.
  //     if(view.$el.children().length === 0) {
  //       this.content.$el.append(view.render().el);
  //     } else {
  //       this.content.$el.append(view.el);
  //     }
      
  //     // Let marionnette know about this view.
  //     this.content.attachView(view);
  //     view.revive();
  //   } else {
  //     this.content.show(view);
  //   }
  // }

});