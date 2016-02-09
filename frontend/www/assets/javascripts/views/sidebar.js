Omg.Views.Sidebar = Backbone.Marionette.ItemView.extend({
  className: 'sidebar-container menu-push',
  template: JST['_jst/sidebar.html'],

  visible: false,

  events: {
    'click .sidebar-link':     'hide',
    // 'click .sign-out-btn':  'logout',
    // 'click .account-link':  'signup',
    'click .close-container':  'hide',
    'click .close-menu':       'closeMenu',
    'keypress #q':             'onKeyPress',
    'click .sign-in-btn':      'login',
    'click .sign-out-btn':     'logout',
    'click .cached_addresses': 'clicked_cached_addresses',
    'click .car2go_cancel':    'car2go_cancel',
    'click #contribute':       'clickedContribute',
    'click .mail-us': 'clickedMailUs'
  },

  initialize: function() {
    var self = this;
    this.listenTo(Omg.vent, 'sidebar:toggle', this.toggle, this);
    this.listenTo(Omg.vent, 'sidebar:hide',   this.hide,   this);
    this.listenTo(Omg.vent, 'sidebar:show',   this.show,   this);

    this.listenTo(Omg.vent, 'user:logged_in',   this.loggedIn,        this);
    this.listenTo(Omg.vent, 'user:logged_out',  this.loggedOut,       this);
    
    //TODO(Richard): If we move Car2Go to statusbar entirely, then Car2Go code should be removed from this class

    //this.listenTo(Omg.vent, 'car2go:updated',   this.car2go_updated,  this);
    //this.listenTo(Omg.vent, 'car2go:canceled',  this.car2go_canceled, this);

    //TODO(Richard): Probably need to delay this a moment to ensure that the
    //Car2go info is loaded
    if(typeof(Omg.car2go.get('address'))!=="undefined")
      this.car2go_updated();

    this.$el.on('click', function(e) {
      if(e.target.id !== 'contribute') {
        e.stopPropagation();
      }
    })
  },

  car2go_updated: function(){
    //Get address and use only the first part of it (drop the city and zip code)
    var address=Omg.car2go.get('address');
    address=address.substr(0,address.indexOf(','));

    //Get license plate info
    var license=Omg.car2go.get('licenseplate');
    this.$el.find('#car2go_sbinfo').html(address+'<br>'+license);
    this.$el.find('#car2go_sidebar').show();
  },

  car2go_canceled: function(){
    this.$el.find('#car2go_sidebar').hide();
  },

  car2go_cancel: function(){
    Omg.vent.trigger('car2go:cancel');
  },

  toggle: function() {
    console.log('toggle');
    if (this.visible) {
      this.hide();
    } else {
      this.show(); 
    }

    $('#btn-sidebar').toggleClass('active');
  },

  closeMenu: function(e) {
    if(e) { e.preventDefault(); }
    Omg.router.navigate(e.currentTarget.hash);
    this.hide();
  },

  hide: function(e) {
    console.log("Hide Sidebar");
    var self = this;
    if(!$('#app').hasClass('push-toright'))
      return;

    if(e) { e.preventDefault(); }

    Omg.vent.trigger('allow_clicks');
    
    this.visible = false;

    $('#app, .navbar-fixed-top').removeClass('push-toright');
    this.$el.removeClass('push-toright-sidebar');
    $('html, body, #application, #app').removeClass('noscroll');

    setTimeout(function() {
      var redraw = self.offsetHeight;
    }, 600);
  },

  show: function() {
    var self = this;
    if($('#app').hasClass('push-toright'))
      return;

    Omg.vent.trigger('prevent_clicks');

    this.visible = true;

    $('#app, .navbar-fixed-top').addClass('push-toright');   
    this.$el.addClass('push-toright-sidebar');

    $('html, body, #application, #app').addClass('noscroll');

    Omg.vent.trigger('rightnav:hide');
  },

  login: function(e) {
    if(e) { e.preventDefault(); }
    this.hide();
    Omg.vent.trigger('login:show');
  },

  logout: function(e) {
    if(e) { e.preventDefault(); }
    Omg.user.logout();
    this.hide();
  },

  signup: function(e) {
    this.hide();
  },

  loggedIn: function() {
    this.render();
  },

  loggedOut: function() {
    this.render();
  },

  loginError: function() {
    this.$el.find('.signin-error').show();
  },

  onKeyPress: function(e) {
    if (e.which == 13) {
      this.searchboxAction();
      $(':input').blur();
    }
  },

  clicked_cached_addresses: function(e){
    if(e) { e.preventDefault(); }
    var target = $(e.currentTarget);
    Omg.vent.trigger('location:choose_cached', this.$el.find('.sb-search-input').first(), true);
  },

  clickedMailUs: function(e) {
    logEvent('Click', 'event', 'Email Us', '');
    if(Omg.device === 'Android' || Omg.device === 'iOS') {
      e.preventDefault();
      window.open('mailto:hello@omgtransit.com', '_system', 'location=no');
    }
  },

  searchboxAction: function(e) {
    if (e) e.preventDefault();

    var q = this.$el.find('#q');

    if (!q.is(":visible")) {
      this.$el.find('.sb-search').toggleClass('sb-search-active');
      return;
    }
   
    var val = q.val();

    if (val === '') {
      return;
    }
    var virtual_search = '/virtual/address_search.php?q='+encodeURI(val);
    logEvent('Search Box', 'pageview', virtual_search);

    // Notify everyone of serach!
    Omg.vent.trigger('location:geocode_address_and_center_on_it', val);
    this.hide();
  }
});