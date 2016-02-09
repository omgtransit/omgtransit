var AppController = Marionette.Controller.extend({

  initialize: function(options) {
    this.layout = new Omg.Layouts.Application();
    this.layout.render();
    Omg.bodyRegion.show(this.layout);
    
    this.layout.car2go_reg.show( new Omg.Views.Car2GoReg() );
    this.layout.statusbar.show( new Omg.Views.Statusbar() );

    this.layout.navbar.show( new Omg.Views.Navbar() );
    this.layout.toolbar.show( new Omg.Views.Toolbar() );

    // this.layout.destinationLocation.show( new Omg.Views.DestinationLocation() );
    // this.layout.login.show          ( new Omg.Views.Login()                    );
    this.layout.alertOverlay.show   ( new Omg.Views.AlertOverlay()             );
  },

  changeView: function(name, args, path, analytics_code) {
    window.scrollTo(0, 0);

    if(name === 'Map') {
      this.addMapUi();
    } else {
      this.removeMapUi();

      if(name !== 'List') {
        $('.btn-refresh-container').hide();
      }
    }

    this.layout.content.show( new Omg.Views[name](args) );

    if(name !== 'SignIn' && name !== 'SignUp') {
      Omg.route.previous = Omg.route.current;
      Omg.route.current = path;
    }
    
    logEvent(name, 'pageview', '/virtual/' + (analytics_code) ? analytics_code : path );
  },

  addMapUi: function() {
    $('.btn-refresh-container').hide();
    Omg.map_visible = true;
    $('.app-container').addClass('map-container');
  },

  removeMapUi: function() {
    Omg.map_visible = false;
    $('.app-container').removeClass('map-container');
    $('.btn-current-location').hide();
  },

  index: function() {
    this.changeView('Index', null, 'list');
  },

  table: function() {
    this.index();
  },

  map: function() {
    this.changeView('Map', null, 'map');
  },

  stop: function(source, id) {
    this.changeView('Stop', { model: new Omg.Models.Stop({ id: id, source: source }) }, 'stop');
  },

  trips: function() {
    this.changeView('Trips', null, 'trips');
  },

  log: function() {
    this.changeView('TripLog', null, 'trips/log', 'trip_log');
  },

  favorites: function() {
    this.changeView('Fav', null, 'favorites', 'fav');
  },

  me: function() {
    this.changeView('Me', null, 'me');
  },

  search: function() {
    this.changeView('Search', null, 'search');
  },
  
  sign_in: function() {
    this.changeView('SignIn', null, 'me/sign_in', 'login');
  },

  sign_out: function() {
    this.changeView('SignOut', null, 'me/sign_out', 'logout');
  },

  forgot_password: function() {
    this.changeView('ForgotPassword', null, 'me/forgot_password', 'forgot_password');
  },

  sign_up: function() {
    console.log('test');
    this.changeView('SignUp', null, 'me/sign_up', 'signup');
  },

  alerts: function() {
    this.changeView('Alert', null, 'alerts');
  },

  filters: function() {
    this.changeView('Filter', null, 'filters');
  },

  help: function() {
    this.changeView('Help', null, 'help');
  },

  notes: function() {
    this.changeView('Notes', null, 'release_notes');
  },

  legal: function() {
    this.changeView('Legal', null, 'legal');
  },

  about: function() {
    this.changeView('About', null, 'about');
  },

  news: function() {
    this.changeView('News', null, 'news');
  },

  mobileapps: function() {
    this.changeView('MobileApps', null, 'mobileapps');
  },

  hideHud: function() {
    $('.app-container').removeClass('map-container');
    $('body').removeClass('noscroll');

    Omg.hud.$el.hide();
    $('.btn-current-location').hide();
    Omg.list_visible = false;
  }

});