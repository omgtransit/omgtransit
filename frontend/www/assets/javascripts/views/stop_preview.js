/*
|----------------------------------------------------------------------------------------------------
| StopPreviewView
|----------------------------------------------------------------------------------------------------
*/

Omg.Views.StopPreview = Backbone.Marionette.ItemView.extend({
  el:               '#view-stop-preview',
  template:         JST['_jst/hud.html'],
  loading_template: _.template('<img src="assets/images/horz_loading.gif" class="loading">'),

  initialize: function(){
    this.stop_box    = this.$el.find('.stopbutton');
  },

  render: function() {
    this.$el.html(this.template({view:this.view,stop:this.stop}));
  },

  change: function(view,stop) {
    this.view = view;
    this.stop = stop;
    this.render(this.view, this.stop);
  },

  update: function() {
    var self = this;
    var str  = '';
    this.view.collection.reset();
    this.view.update(function() {
      
      if( self.view.$el.find('span').length ) {
        str = self.view.$el.html();
      } else {
        str = '<div class="label route-chip">No Data</div>';
      }

      self.$el.find('.stop-chip-data').html(str);
    });

  },

  show: function(){
    this.$el.html(this.loading_template());
    this.$el.addClass('active');
  },

  hide: function(){
    this.$el.removeClass('active');
  }

});