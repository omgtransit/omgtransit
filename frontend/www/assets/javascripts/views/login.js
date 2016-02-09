/*
|----------------------------------------------------------------------------------------------------
| Login View
|----------------------------------------------------------------------------------------------------
*/

Omg.Views.Login = Backbone.Marionette.ItemView.extend({
  template: JST['_jst/login.html'],

  events: {
    'click .btn-hide-login': 'hide',
    'click .guest-link':     'hide',
    'click .account-link':   'signupClicked',
    'click .show-legal':     'showLegal',
    'click .forgot-link':    'showForgot',
    'click .btn-signin':     'signin',
    'submit #form-login':    'login',
    'submit #form-signup':   'signup',
    'submit #retrieve-password-form': 'retrieve',
    'focusout input': 'blurInput'
  },

  formType: 'login',

  initialize: function() {
    this.listenTo(Omg.vent, 'login:show',     this.show,       this);
    this.listenTo(Omg.vent, 'signup:show',    this.showSignup, this);
    this.listenTo(Omg.vent, 'user:logged_in', this.loggedIn,   this);

    this.listenTo(Omg.vent, "error:user:sign_up",   this.showSignupErrors, this);
    this.listenTo(Omg.vent, 'error:user:logged_in', this.loginError,       this);

    this.passwordModel = new Omg.Models.PasswordRecovery();
  },

  hide: function(e) {
    if(e) { e.preventDefault(); }
    $('#login').hide();
    window.scrollTo(0,0);
  },

  show: function() {
    this.formType = 'login';
    this.swapForms();
    logEvent('Login', 'pageview', '/virtual/login');
    $('#login').show();
  },

  showSignup: function() {
    this.formType = 'signup';
    this.swapForms();
    logEvent('Sign Up', 'pageview', '/virtual/signup');
    $('#login').show();
  },

  // ================================
  // Login Methods
  // ================================

  loggedIn: function() {
    this.hide();
  },

  loginError: function() {
    this.$el.find('.signin-error').show();
    this.$el.find('#user_email').focus();
  },

  blurInput: function() {
    var offset = this.$el[0].offsetWidth;
    setTimeout(function() {
      window.scrollTo(0, 0);
    }, 0);
  },

  login: function(e) {
    if(e) { e.preventDefault(); }
    logEvent('Click', 'event', 'Account', 'Login');
    Omg.user.getNewSession(this.$el.find('#login_email').val().toLowerCase(), this.$el.find('#login_password').val());
  },

  signin: function(e) {
    e.preventDefault();
    $("#form-login").submit();
  },

  swapForms: function() {
    if ( this.formType === 'signup' ) {
    
      this.$el.find('#form-signup').show();
      this.$el.find('#form-login').hide();
      this.$el.find('#retrieve-password-form').hide();
      this.$el.find('.account-link').html('Back to Log In.');
    
    } else if ( this.formType === 'login' ) {
    
      this.$el.find('#form-signup').hide();
      this.$el.find('#retrieve-password-form').hide();
      this.$el.find('#form-login').show();
      this.$el.find('.account-link').html('Not a member? Sign Up.');
    
    } else if ( this.formType === 'forgot' ) {
    
      this.$el.find('#retrieve-password-form').show();
      this.$el.find('#form-signup').hide();
      this.$el.find('#form-login').hide();
      this.$el.find('.account-link').html('Back to Log In.');
      this.formType = 'forgot';
    
    }
  },

  signupClicked: function(e) {
    if(e) { e.preventDefault(); }

    if (this.formType === 'signup' || this.formType === 'forgot') {
      this.formType = 'login';
    } else {
      this.formType = 'signup';
    }

    this.swapForms();
  },

  // ================================
  // Signup Methods
  // ================================

  formatErrorString: function(errors) {
    var errorString = '';

    for (var i in errors) {
      errorString = errorString + i.substr(0,1).toUpperCase() + i.substr(1) + ': ' + errors[i] + '<br>';
    }

    return errorString;
  },

  showSignupErrors: function(e) {
    console.log('show signup');
    this.$el.find('.signup-errors').html(this.formatErrorString(e)).show();
  },

  signup: function(e) {
    e.preventDefault();

    logEvent('Click', 'event', 'Account', 'Sign Up');

    var form = $('#form-signup');
    Omg.user.create( form.find('#user_first_name').val(), form.find('#user_last_name').val(), form.find('#user_email').val().toLowerCase(), form.find('#user_password').val() );
  },

  showForgot: function(e) {
    e.preventDefault();
    this.formType = 'forgot';
    logEvent('Forgot Password', 'pageview', '/virtual/forgot_password');
    this.swapForms();
  },

  showLegal: function(e) {
    this.hide();
    Omg.router.navigate('#/legal');
  },

  retrieve: function(e) {
    var self = this;

    e.preventDefault();

    this.passwordModel.save({
        email: self.$el.find('#email').val()
      }, {
      success: function() {
        console.log('success!');
        self.$el.find('.password-success').show();
        self.$el.find('.password-error').hide();
        self.$el.find('#email').val('');
      },
      error: function(e, response) {
        self.$el.find('.password-success').hide();
        console.log(arguments);
        if(response.responseJSON.errors) {
          self.$el.find('.password-error').html(response.responseJSON.errors.join('<br>'));
        }
        self.$el.find('.password-error').show();
      }
    });

  }
});