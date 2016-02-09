/*
|----------------------------------------------------------------------------------------------------
| IndexView
|----------------------------------------------------------------------------------------------------
*/

Omg.Views.Alert = Backbone.Marionette.ItemView.extend({
  className: 'alert-container',
  template: JST['_jst/pages/alert.html'],
  alertlistTemplate: JST['_jst/alertlist.html'],
  views: {},

  events: {
    'click .trashalert': 'delete',
    'click .stopbutton': 'gotoStop'
  },

  initialize: function() {
    this.collection = new Omg.Collections.Alerts();
    this.collection.on('change', function() {
      console.log('change collection');
    });
  },

  onRender: function() {
    this.update();
  },

  update: function() {
    var self = this;

    if ( Omg.user.signedIn ) {
      this.collection.fetch({ 
        data: {
          user_email: Omg.user.get('email'),
          user_token: Omg.user.get('auth_token')
        },
        success: function() {
          self.add();
        }
      });
    }
  },

  gotoStop: function(e) {
    e.preventDefault();

    var target = $(e.currentTarget);
    
    Omg.currentStop = null;
    console.log('/' + target.data('url'));
    Omg.router.navigate('#/stop/' + target.data('url'));
  },

  add: function() {
    console.log(this.collection);
    this.$el.find('#table-results').html( this.alertlistTemplate({ alerts: this.collection }) );

    console.log();
  },

  delete: function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    var parent = $(e.currentTarget).parent();
    var id = parent.data("id");
    var model = this.collection.get(id);
    
    if (model) {
      model.destroy();
      this.collection.trigger('change');
      parent.remove();
    }
    
  },

  onClose: function(){
    // custom cleanup or closing code, here
    console.log('closing :: alert view');
  }

});