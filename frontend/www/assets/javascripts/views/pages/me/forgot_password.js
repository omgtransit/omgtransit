/*
|----------------------------------------------------------------------------------------------------
| Forgot
|----------------------------------------------------------------------------------------------------
*/

Omg.Views.ForgotPassword = Backbone.Marionette.ItemView.extend({
  template: JST['_jst/pages/forgot_password.html'],
  className: 'signin-container container',

  events:  {
    'submit #retrieve-password-form': 'reset',
  },

  initialize: function() {
    this.passwordModel = new Omg.Models.PasswordRecovery();
  },

  onShow: function() {
    this.forgetButton = this.$el.find('.btn-password-forget');
  },

  reset: function(e) {
    var self = this;
    e.preventDefault();

    this.forgetButton.html('<i class="icon-spinner spinner"></i> Sending...');

    this.passwordModel.save({
      email: this.$el.find('#email').val()
    },
    {
      success: function() {
        self.$el.find('.password-success').show();
        self.$el.find('.password-error').hide();
        self.$el.find('#email').val('');
        self.$el.find('.control-group').hide();
        self.forgetButton.html('Send me password reset instructions');
      },
      error: function(e, response) {
        var responseJSON = JSON.parse(response.responseText);
        self.$el.find('.password-success').hide();
        
        if( responseJSON.errors ) {
          self.$el.find('.password-error').html( responseJSON.errors.join('<br>') );
        }
        self.$el.find('.password-error').show();
        self.forgetButton.html('Send me password reset instructions');
      }
    });

  }

});