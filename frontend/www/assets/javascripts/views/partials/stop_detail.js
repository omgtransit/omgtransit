/*
|----------------------------------------------------------------------------------------------------
| StopItemView
|----------------------------------------------------------------------------------------------------
*/

Omg.Views.StopViewDetail = Backbone.View.extend({

  el: '.stop_detail',
  headerTemplate: JST['_jst/partials/stop_detail.html'],

  events: {
    'click .detail-back': 'backClicked',
  },
  
  initialize: function(arguments) {
    _.bindAll(this);

    this.listenTo(Omg.vent, 'app:tick', this.tick, this);

    var stoptype  = arguments.stop.stop_type;
    this.template = JST['_jst/sv_'+stoptype+'.html'];

    this.$el.addClass('sv_'+stoptype);

    //Extract, e.g. "car2go", "amtrak", "msp" from stop_url
    var sourcetype = arguments.stop.stop_url.replace(/\/.*/,'').toLowerCase();

    if(sourcetype=="car2go" || sourcetype=="zipcar")
      $('.list-notice').hide();

    this.stop = arguments.stop;

    this.stop.parser       = this.stop.stop_type;
    this.stop.realtime_url = this.setupUrl(this.stop.stop_url);
    this.collection        = new Omg.Collections.BusETA({stop:this.stop});

    //GOOGLE ANALYTICS STUFF
    logEvent('Stops Page: '+ sourcetype.toLowerCase() + ': ' +arguments.stop.stop_name, 'pageview', '/virtual/stops/'+arguments.stop.stop_url.toLowerCase());
  },

  setupUrl: function(url) {
    url = url.replace('callback=?', '');
    console.log(AppConfig.realtimeUrl + '/' + url);
    return AppConfig.realtimeUrl + '/' + url;
  },

  render: function(collection) {
    var self = this;
    
    this.$el.html( this.headerTemplate({ stop: this.stop }) );
    
    if( collection.length === 0 )
      return;
    else
      var mm = matchMedia('only screen and (max-width: 767px)').matches;
      for(var i=0, len=collection.length; i < len; i++) {
        var item = collection.at(i);
        var description = item.get('description');
        if(description) {
          if( description.length > 30 && mm ) {
            item.set('description', description.substr(0,30)+" &hellip;");
          }
        }
      }
          
      this.$el.append(this.template({stop:this.stop, models:collection.toJSON()}));

    this.favoriteView = new Omg.Views.Favorite({ el: '.favorite', stop_id: this.stop.id});
  },

  update: function() {
    var self = this;
    this.$el.find('.loading').show();

    if ( this.stop ) {
      this.collection.fetch({ success: function(collection) {
        self.process_data(collection);
        self.$el.find('.loading').hide();
      }, error: function() {
        self.$el.find('.loading').hide();
      } });
    }

  },

  tick: function() {
    this.update();
  },

  process_data: function(collection, num_models) {
    collection.process_models(num_models);
    this.render(collection);
  },

  format_data: function(collection) {
    var data = _.map(collection.toJSON(),
      function(obj) {
//        if(obj.DepartureTime<20 && obj.DepartureText.indexOf(":")!=-1)
//          obj.DepartureText+='&nbsp;<i title="Bus scheduled, no real-time data available." class="icon-question-sign"></i>';

        obj.sdesc=obj.Description;
        if(obj.sdesc && obj.sdesc.length>25 && matchMedia('only screen and (max-width: 767px)').matches)
          obj.sdesc=obj.Description.substr(0,25)+" &hellip;";

        return obj;
      }
    );

    return data;
  },

  backClicked: function() {
    Omg.router.navigate('#/' + Omg.route.previous);
  }

});