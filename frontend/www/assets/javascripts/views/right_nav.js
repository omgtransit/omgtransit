Omg.Views.RightNav = Backbone.Marionette.ItemView.extend({
  template: JST['_jst/right_nav.html'],
  className: 'right-nav-container',

  events: {
    'click .close-menu': 'close',
  },
 
  initialize: function() {
    this.listenTo(Omg.vent, 'rightnav:toggle', this.toggle, this);
    this.listenTo(Omg.vent, 'rightnav:hide', this.hide, this);

    this.listenTo(Omg.vent, 'user:logged_in', this.loggedIn, this);
    this.listenTo(Omg.vent, 'user:logged_out', this.loggedOut, this);
 
    this.$el.on('click', function(e) {
      e.stopPropagation();
    })
  },

  render: function() {
    var self = this;

    this.$el.html(this.template());

    setTimeout(function() {
      self.filter = new Omg.Views.Filter({ el: '.filters' });
      self.filter.render();
    }, 1000);
  },

  toggle: function(e) {
    if(e) { e.preventDefault(); }
    if (this.visible) {
      this.hide();
    } else {
      this.show();
    }
  },

  loggedIn: function() {
    this.filter.render();
  },

  loggedOut: function() {
    this.filter.render();
  },

  show: function() {
    if($('#app').hasClass('push-toleft'))
      return;

    this.visible = true;
    $('#app, .navbar-fixed-top, .right-nav-container').addClass('push-toleft');
    Omg.vent.trigger('prevent_clicks');
    $('html, body, #application, #app').addClass('noscroll');

    Omg.vent.trigger('sidebar:hide');
  },

  hide: function() {
    if(!$('#app').is('.push-toleft'))
      return;

    this.visible = false;
    $('#app, .navbar-fixed-top, .right-nav-container').removeClass('push-toleft');
    Omg.vent.trigger('allow_clicks');
    $('html, body, #application, #app').removeClass('noscroll');
  },

  showSignIn: function(e) {
    e.preventDefault();
    Omg.vent.trigger('login:show');
  },

  showSignUp: function(e) {
    e.preventDefault();
    Omg.vent.trigger('signup:show');
  },

  close: function(e) {
    console.dir(e.currentTarget);
    if(e) { e.preventDefault(); }
    Omg.router.navigate(e.currentTarget.hash);
    this.hide();
  }

});