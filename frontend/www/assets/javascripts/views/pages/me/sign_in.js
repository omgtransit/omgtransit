/*
|----------------------------------------------------------------------------------------------------
| SignIn
|----------------------------------------------------------------------------------------------------
*/

Omg.Views.SignIn = Backbone.Marionette.ItemView.extend({
  template: JST['_jst/pages/signin.html'],
  className: 'signin-container container',

  events:  {
    'submit #form-signin': 'signin'
  },

  initialize: function(redirect_to) {
    this.redirect_to = redirect_to;

    this.listenTo(Omg.vent, 'user:logged_in', this.success, this);
    this.listenTo(Omg.vent, "error:user:sign_up",   this.error, this);
  },

  signin: function(e) {
    if(e) { e.preventDefault(); }
    Omg.user.getNewSession(this.$el.find('#login_email').val().toLowerCase(), this.$el.find('#login_password').val());
    this.$el.find('.btn-signin').html('<i class="icon-spinner spinner"></i> Working...');

    logEvent('Click', 'event', 'Account', 'Login');
  },

  success: function() {
    Omg.router.navigate('#/' + Omg.route.current);
  },

  error: function() {
    this.$el.find('.btn-signin').html('Sign In');
    this.$el.find('.signin-error').show();
    this.$el.find('#user_email').focus();
  }
});