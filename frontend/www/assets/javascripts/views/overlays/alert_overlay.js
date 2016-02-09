/*
|----------------------------------------------------------------------------------------------------
| AlertView
|----------------------------------------------------------------------------------------------------
*/

Omg.Views.AlertOverlay = Backbone.Marionette.ItemView.extend({
  
  template: JST['_jst/alert_overlay.html'],
  templateContent: JST['_jst/alert_content.html'],

  className: 'overlay overlay-contentscale overlay-alert',
  events: {
    'click .overlay-close': 'close',
    'click .btn-set-alert': 'sendAlert',
    'click #alert-recurring': 'recurringClicked',
    'click .btn-signin': 'showSignIn',
    'click .btn-alert-mobile': 'navigateToMobile'
  },

  initialize: function() {
    this.listenTo(Omg.vent, 'alert:show', this.show, this);
    this.listenTo(Omg.vent, 'user:logged_in', this.loggedIn, this);
    this.listenTo(Omg.vent, 'user:logged_out', this.loggedOut, this);
  },

  render: function() {
    this.$el.html( this.template() );
  },

  loggedIn: function() {

    if(this.showing) {
      
      this.render();
      
      if(this.data) {
        this.show(this.data);
      }
      
    }

  },

  loggedOut: function() {
    
    if(this.showing) {
      
      this.render();
      
      if(this.data) {
        this.show(this.data);
      }  
    }

  },

  show: function(data) {
    this.showing = true;
    this.model = new Omg.Models.Alert();
    this.data = data;
    this.render();
    
    this.$el.find('.alert-content').html(this.templateContent({ data: data }));

    this.alertTime = data.alertTime;
    this.stopModel = data.stopModel;
    this.model.set(data.model.attributes);
    
    this.$el.addClass('open');
    logEvent('Set Alert', 'pageview', '/virtual/set_alert');
  },

  close: function(e) {
    if (e) { e.preventDefault(); }
    this.showing = false;
    this.$el.removeClass('open');
    window.scrollTo(0,0);
  },

  navigateToMobile: function() {
    this.close();
    Omg.router.navigate('#/mobileapps');
  },

  sendAlert: function() {

    this.model.setAlert({
      stop_model: this.stopModel,
      realtime_model: this.model,
      alertTime: this.alertTime,
      offset: this.$el.find('#alert-select').val(),
      recurring: this.$el.find('#alert-recurring').is(":checked"),
      recurring_days: this.formatRecurring()
    });

    this.model.save();
    logEvent('Click', 'event', 'Alerts', 'Set Alert');

    this.close();
  },

  formatRecurring: function() {
    return this.$el.find('.alert-day-list input:checked').map(function(){
       return $(this).val();
    }).get().join(",");
  },

  recurringClicked: function() {
    if( this.$el.find('#alert-recurring').is(":checked") ) {
      this.showDays();  
    } else {
      this.hideDays();
    }
  },

  showDays: function() {
    this.$el.find('.alert-day-list input[type=checkbox]').attr('checked', true);
    this.$el.find('.alert-day-list').show();
  },

  hideDays: function() {
    this.$el.find('.alert-day-list').hide();
    this.$el.find('.alert-day-list input[type=checkbox]').attr('checked', false);
  },

  saveLocal: function() {
    console.log(this.model.toJSON());
  },

  showSignIn: function(e) {
    e.preventDefault();
    Omg.vent.trigger('login:show');
  },

  showSignUp: function(e) {
    e.preventDefault();
    Omg.vent.trigger('signup:show');
  }

});