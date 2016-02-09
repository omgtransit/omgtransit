//TODO(Richard): Could make this whole thing work more like a traditional model, probably
Omg.Models.Car2Go = Backbone.Model.extend({

  //urlRoot: '/car2go',

  initialize: function() {
    _.bindAll(this);
    var self=this;

    this.listenTo(Omg.vent, "car2go:reserve", this.reserve, self);
    this.listenTo(Omg.vent, "car2go:cancel",  this.cancel,  self);

    //TODO(Richard): There may be a memory leak here
    $(document).on('click', '.car2go_reserve', this.reserve_click.bind(self) );

    self.fetch();
  },

  reserve_click: function(e){
    e.stopPropagation();

    var stopid=$(e.target).data('stopid');
    if(typeof(stopid)==="undefined"){
      Omg.vent('message:error', 'Unable to get car2go ID. Please contact OMG Transit.');
      return false;
    }

    this.reserve(stopid);

    return false;
  },

  reserve: function(id){
    var self=this;

    if(!Omg.user.signedIn){
      Omg.vent.trigger('login:show');
      return;
    }

    $('.car2go_reserve').addClass('disabled');
    Omg.vent.trigger('message:thinking');

    id=id.substring(id.indexOf('-')+1); //Remove source_id from stop_id
    logEvent('reservation_attempt_begun', 'event', 'car2go', '');

    $.getJSON(AppConfig.backendUrl+'/car2go/reserve/'+id+'?user_email=' + Omg.user.get('email') + '&user_token=' + Omg.user.get('auth_token'))
      .done(function(data,textStatus){
        if(data.status=="no_car2go_access")
          Omg.vent.trigger('car2go:register');
        else if (data.status=="error")
          Omg.vent.trigger('message:error',data.details);
        else if (data.error=="Youneedtosigninorsignupbeforecontinuing."){
          Omg.vent.trigger('message:error','Please sign in!');
          Omg.vent.trigger('login:show');
        } else {
          logEvent('reservation_success', 'event', 'car2go', '');
          self.fetch();
          Omg.vent.trigger('message:success',"car2go reserved!");
        }
        $('.car2go_reserve').removeClass('disabled');
        Omg.vent.trigger('message:donethinking');
      }).fail(function(err){
        $('.car2go_reserve').removeClass('disabled');
        Omg.vent.trigger('message:donethinking');
        Omg.vent.trigger('message:error',err);
      });
  },

  fetch: function(){
    var self=this;
    if( Omg.user.signedIn ) {}
  },

  cancel: function(){
    if(!this.get('lat')) return false;

    Omg.vent.trigger('message:thinking');

    $.getJSON(AppConfig.backendUrl+'/car2go/cancel/'+this.get('bookingid')+'?user_email=' + Omg.user.get('email') + '&user_token=' + Omg.user.get('auth_token'))
      .done(function(data,textStatus){
        if(data.status=="no_car2go_access"){
          Omg.vent.trigger('message:donethinking');
          return false;
        } else {
          Omg.vent.trigger('message:donethinking');
          Omg.vent.trigger('car2go:canceled');
          Omg.vent.trigger('message:success', 'car2go reservation canceled.');
        }
      }); 
  }

});