/*
|----------------------------------------------------------------------------------------------------
| SignUp
|----------------------------------------------------------------------------------------------------
*/

Omg.Views.SignUp = Backbone.Marionette.ItemView.extend({
  template: JST['_jst/pages/signup.html'],
  className: 'signin-container container',

  events:  {
    'click .btn-signup': 'signup'
  },

  initialize: function(redirect_to) {
    this.redirect_to = redirect_to;

    this.listenTo(Omg.vent, 'user:logged_in', this.success, this);
    this.listenTo(Omg.vent, "error:user:sign_up",   this.showSignupErrors, this);
  },

  signup: function(e) {
    if(e) { e.preventDefault(); }

    this.$el.find('.btn-signup').html('<i class="icon-spinner spinner"></i> Working...');
    logEvent('Click', 'event', 'Account', 'Sign Up');

    var form = $('#form-signup');
    Omg.user.create( form.find('#user_first_name').val(), form.find('#user_last_name').val(), form.find('#user_email').val().toLowerCase(), form.find('#user_password').val() );

  },

  success: function() {
    Omg.router.navigate('#/' + Omg.route.current);
  },

  formatErrorString: function(errors) {
    console.log(errors);
    var errorString = '';

    for (var i in errors) {
      errorString = errorString + i.substr(0,1).toUpperCase() + i.substr(1) + ': ' + errors[i] + '<br>';
    }

    if(errorString === '') {
      errorString = 'One or more fields were missing.';
    }

    return errorString;
  },

  showSignupErrors: function(e) {
    this.$el.find('.btn-signup').html('Sign up');
    this.$el.find('.signup-errors').html(this.formatErrorString(e)).show();
  }

});