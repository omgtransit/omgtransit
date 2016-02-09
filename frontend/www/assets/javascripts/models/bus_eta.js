/*
|----------------------------------------------------------------------------------------------------
| BusETAModel
|----------------------------------------------------------------------------------------------------
*/

Omg.Models.BusETA = Backbone.Model.extend({

  set_time_text: function() {
    var dt        = this.get('dt');
    var time_text = "";

    if (dt <= 1 && dt >= 0) {
      time_text = 'Now';
    } else if ( dt < 20 || dt < 0 ) {
      time_text = Math.round(dt) + ' Min';
    } else if ( dt >= 20 ) {
      time_text = this.getTimeFormatted();
    }

    //TODO(Richard): Move this out of here
    if (!this.get('actual') && dt < 20)
      time_text += ' <i title="Real-time data unavailable" class="icon-question-sign"></i>';
    
    this.set('TimeText', time_text);
  },
  
  getTimeFormatted: function(format_str) {
    var event_time = moment(this.get('time')*1000);

    if(typeof(format_str)==='undefined'){
      format_str = 'h:mm';
      if(event_time.diff(moment(),'hours')>=6) //Hours until the event
        format_str = 'ddd h:mma';
    }

    return event_time.format(format_str);
  },

  set_direction_class: function() {
    var direction = this.get('direction');
    
    var directions_translate={
      'south':      'icon-omg-arrow-down',
      'north':      'icon-omg-arrow-up',
      'east':       'icon-omg-arrow-right',
      'west':       'icon-omg-arrow-left',
      'loop':       'icon-refresh',
      'inbound':    'icon-omg-arrow-up',
      'outbound':   'icon-omg-arrow-down',
      'outinbound': ''
    };

    if(typeof(directions_translate[direction])==='undefined')
      console.error('Undefined route direction: ',direction);
    else
      this.set('direction', directions_translate[direction]);
  },

  set_priority: function() {
    var dt = this.get('dt');

    if(dt < 6) {
      this.set('priority', "p0");
    } else if (dt < 11 && dt >= 0) {
      this.set('priority', "p5");
    } else if (dt < 20 && dt >= 0) {
      this.set('priority', "p12");
    } else {
      this.set('priority', "p20");
    }
  },

  process_eta: function() {
    var stop_time = this.get('time');
    var now       = moment().unix();
    var dt        = Math.floor((stop_time-now)/60);  //Convert to minutes
    
    this.set('dt', dt);
    this.set_priority();
    this.set_direction_class();
    this.set_time_text();
  },



  //TODO(Richard): The following needs to be fixed in light of the changes made above.
  process_air_eta: function() {
    var departure_time = this.get('DepartureTime');

    var dt = moment.utc(departure_time*1000).diff(moment.utc()) / 1000 / 60; //Convert to minutes

    this.set('dtime', dt);
    this.set_air_priority();
    if(dt<1)
      this.set('DepartureText', 'Now');
    else if(dt>=60){
      //Round to hours, drop '.0'
      this.set('DepartureText',((dt/60).toFixed().replace('.0',''))+" Hr");
    } else
      this.set('DepartureText',Math.round(dt).toString()+" Min");

    this.set('Route', this.get('flight')[0]);
    this.set('ChipText', this.get('DepartureText'));
    this.set('StopText', this.get('DepartureText'));
  },

  set_air_priority: function() {
    var eta = this.get('dtime');

    if(eta < 45)
      this.set('priority', "p0");
    else if (eta < 90)
      this.set('priority', "p5");
    else if (eta < 120)
      this.set('priority', "p12");
    else
      this.set('priority', "p20");
  },

});