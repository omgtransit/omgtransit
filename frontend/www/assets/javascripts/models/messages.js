Omg.Models.Messages = Backbone.Model.extend({
  templateMessage: _.template('<div class="message <%= type %>"><%= message %></div>'),

  events: {},

  initialize: function() {
    _.bindAll(this);
    this.listenTo(Omg.vent, "message:error",        this.error,        this);
    this.listenTo(Omg.vent, "message:success",      this.success,      this);
    this.listenTo(Omg.vent, "message:thinking",     this.thinking,     this);
    this.listenTo(Omg.vent, "message:donethinking", this.doneThinking, this);
    this.displayTime = 3000;
    this.thinkings   = 0;
  },

  success: function(message, showsecs){
    this.makeMessage(message,'success',showsecs);
  },

  error: function(message, showsecs){
    this.makeMessage(message,'error',showsecs);
  },

  makeMessage: function(message, type, showsecs){
    var self    = this;
    console.log(message);
    if(typeof(showsecs)==='undefined')
      showsecs=self.displayTime;
    else
      showsecs=showsecs*1000;
    var messbox = self.templateMessage({message:message, type:type});
    messbox = $(messbox).appendTo('#messages');
    $('#messages').show();
    messbox.on('click', function() {
      self.hideMessage(messbox);
    });
    setTimeout(function(){self.hideMessage(messbox);}, showsecs);
  },

  hideMessage: function(messbox) {
    $(messbox).remove();
    $('#messages').hide();
  },

  thinking: function(){
    this.thinkings += 1;
    $('#thinkingbox').show();
  },

  doneThinking: function(){
    this.thinkings -= 1;
    if(this.thinkings<0)
      this.thinkings = 0;
    if(this.thinkings==0)
      $('#thinkingbox').hide();
  }
});