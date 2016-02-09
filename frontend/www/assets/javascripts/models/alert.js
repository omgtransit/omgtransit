/*
|----------------------------------------------------------------------------------------------------
| AlertModel
|----------------------------------------------------------------------------------------------------
*/

Omg.Models.Alert = Backbone.Model.extend({
  urlRoot: AppConfig.backendUrl + '/alert',
  url: function() {
    var id = this.get('id');
    if (id) {
      return AppConfig.backendUrl + '/alert/' + this.get('id') + '?user_email=' + Omg.user.get('email') + '&user_token=' + Omg.user.get('auth_token')
    } else {
      return AppConfig.backendUrl + '/alert/?user_email=' + Omg.user.get('email') + '&user_token=' + Omg.user.get('auth_token')
    }
  },

  initialize: function() {
    this.set( 'now', (new Date().getTime()) );
  },

  setAlert: function(args) {
    var model = args.realtime_model,
        stopModel = args.stop_model;

    this.set({
      'realtime_url':   stopModel.get('stop_url'),
      'alert_time':     this.formatAlertTime( args.alertTime ),
      'offset':         args.offset,
      'start_time':     this.calculateStartTime( args.alertTime, args.offset ),
      'device_token':   localStorage['device_token'],
      'route':          model.get('route'),
      'stop_id':        stopModel.get('id'),
      'platform':       localStorage['platform'],
      'stop_name':      stopModel.get('stop_name'),
      'recurring':      args.recurring,
      'recurring_days': args.recurring_days
    });
  },

  formatAlertTime: function(alertTime) {
    var tarray = alertTime.split(':');
     m = moment().hour(tarray[0]).minute(tarray[1]).utc().format('H.mm');

    return parseFloat(m, 10).toFixed(2);
  },

  // Convert time into a decimal for easy filtering.
  // Eg. 13.41 = 1:41 PM
  calculateStartTime: function(alertTime, offset) {
    // convert time to UTC
    var tarray = alertTime.split(':');
    offset = parseInt(offset,10) + 5;
    var m = moment().hour(tarray[0]).minute(tarray[1]).subtract('m', offset).utc().format('H.mm');
    
    return parseFloat(m, 10).toFixed(2);
  },

  formatTime: function() {
    var time = this.get('alert_time').toString().split('.');

    // If data comes back as 11.4 change it to 11.40
    if(time[1].length == 1) {
      time[1] = time[1] + '0';
    }
    var offset = new Date().getTimezoneOffset();
    return moment().hour(time[0]).minute(time[1]).subtract('m', offset).format('h:mm a');
  }
});