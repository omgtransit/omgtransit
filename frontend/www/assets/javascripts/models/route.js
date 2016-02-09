/*
|----------------------------------------------------------------------------------------------------
| RouteModel
|----------------------------------------------------------------------------------------------------
*/

Omg.Models.Route = Backbone.Model.extend({

  set_time_text: function(time) {
    var dt        = time.dt;
    var time_text = "";

    if (dt <= 1)
      time_text = 'Now';
    else if ( dt < 20 )
      time_text = Math.round(dt) + ' Min';
    else if ( dt >= 20 )
      time_text = this.getTimeFormatted(time);

    //TODO(Richard): Move this out of here
    if (!time.actual && dt < 20)
      time_text += ' <i title="Real-time data unavailable" class="icon-question-sign"></i>';
    
    time.TimeText = time_text;
  },
  
  getTimeFormatted: function(time) {
    var event_time = moment(time.time*1000);

    format_str = 'h:mm';
    if(event_time.diff(moment(),'hours')>=6) //Hours until the event
      format_str = 'ddd h:mma';

    return event_time.format(format_str);
  },

  set_priority: function(time) {
    var dt = time.dt;

    if(dt < 6)
      time.priority = "p0";
    else if (dt < 11)
      time.priority = "p5";
    else if (dt < 20)
      time.priority = "p12";
    else
      time.priority = "p20";
  },

  process: function() {
    var self  = this;
    var times = this.get('times');
    var now   = moment().unix();

    _.each(times, function(time){
      time.dt = Math.floor((time.time-now)/60);  //Convert to minutes
      self.set_priority(time);
      self.set_time_text(time);
    });
  }

});