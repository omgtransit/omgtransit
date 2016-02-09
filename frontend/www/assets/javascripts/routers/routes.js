Omg.Routers.AppRouter = Backbone.Marionette.AppRouter.extend({
  controller: new AppController(),
  
  appRoutes: {
    "" : "index",
    "map": "map",
    "favorites": "favorites",
    "stop/:source/:id": "stop",

    "me": "me",
    "me/sign_in": "sign_in",
    "me/sign_out": "sign_out",
    "me/sign_up": "sign_up",
    "me/forgot_password": "forgot_password",

    "trips": "trips",
    "trips/log": "log",
    
    "search": "search",
    "filters": "filters",
    "alerts": "alerts",
    
    "list":       "index",
    "help":       "help",
    "notes":      "notes",
    "legal":      "legal",
    "mobileapps": "mobileapps",
    "about":      "about",
    "news":       "news"
  },

  onRoute: function(name, path, arguments) {
    Omg.vent.trigger('route:changed', name);
  },

  currentRoute: function() {
    return this.appRoutes[Backbone.history.fragment];
  },

  redirectSearchToMap: function() {
    var route = this.currentRoute();
    if(route !== 'index' && route !== 'map') {
      this.navigate('#/map');
    }
  }

});