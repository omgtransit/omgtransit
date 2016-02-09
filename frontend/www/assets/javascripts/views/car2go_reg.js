/*
|----------------------------------------------------------------------------------------------------
| SignupView
|----------------------------------------------------------------------------------------------------
*/

Omg.Views.Car2GoReg = Backbone.Marionette.ItemView.extend({
  template:  JST['_jst/car2go_reg.html'],
  id:        'car2goreg',
  className: 'overlay overlay-contentscale',
  visible:   false,

  events: {
    'click .overlay-close':    'close',
    'submit #frm-signup':      'register',
    'click #submit-car2goreg': 'register',
    'click #car2go-goback':    'close'
  },

  initialize: function() {
    this.listenTo(Omg.vent, "car2go:register", this.show, this);
    //this.listenTo(Omg.vent, "error:user:sign_up", this.showSignupErrors, this);
    //this.listenTo(Omg.vent, "user:logged_in", this.redirectToHome, this);
  },

  show: function() {
    //Display the overlay
    logEvent('Car2go Login', 'pageview', '/virtual/car2go_login');
    this.$el.addClass('open');
  },

  close: function(e) {
    if (e) { e.preventDefault(); }
    this.$el.removeClass('open');
  },

  redirectToHome: function() {
    Omg.router.navigate('#/table');
  },

  showSignupErrors: function(e) {
    console.log('TODO(Richard): This should probably only execute if the Car2Go Registration dialog is visible.');
    console.log(e);
    if(e) {
      Omg.vent.trigger('message:error','There were the following errors: ' + e.email);
    }
  },

  register: function(e) {
    var self=this;
    e.preventDefault();

    var form = $('#frm-car2go-reg');

    var data={username:form.find('#car2go_username').val(), password:form.find('#car2go_password').val()};
    if(!data.username || !data.password){
      Omg.vent.trigger('message:error','Please provide username and password.');
      return false;
    }

    logEvent('Click', 'event', 'car2go', 'Login');

    self.$el.find('#submit-car2goreg').hide();
    Omg.vent.trigger('message:thinking');

    $.getJSON('/car2go/doauth'+'?user_email=' + Omg.user.get('email') + '&user_token=' + Omg.user.get('auth_token'),data)
      .done(function(data,textStatus){
        console.log(data);
        if(data.status!='success'){
          if (data.status=='bad_login')
            Omg.vent.trigger('message:error','Username or password incorrect. Try again.');
          else if (data.status=='not_granted')
            Omg.vent.trigger('message:error','Token not granted. Try later or contact OMG Transit.');
          else if (data.status=='account_error')
            Omg.vent.trigger('message:error',data.error);
          else
            Omg.vent.trigger('message:error','An unknown error has occurred.');

          Omg.vent.trigger('message:donethinking');
          self.$el.find('#submit-car2goreg').show();
        } else {
          Omg.vent.trigger('message:donethinking');
          logEvent('Confirmation', 'event', 'car2go', 'Login');
          self.$el.find('#car2go_up_block'  ).hide();
          self.$el.find('#car2go_succ_block').show();
        }
      })
      .fail(function(xhr, status){
        Omg.vent.trigger('message:error','Timed out. Check your connection and try again.');
        self.$el.find('#submit-car2goreg').show();
        Omg.vent.trigger('message:donethinking');
      });

    return false;
  },

  onClose: function(){
    // custom cleanup or closing code, here
    console.log('closing :: Omg.Views.Car2GoReg');
  }
});