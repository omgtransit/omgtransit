Omg.Views.SearchResults = Backbone.View.extend({
  template: JST['_jst/partials/search_results.html'],

  events: {
    'click .result': 'resultClicked'
  },

  render: function(data) {
    this.collection = data;
    this.$el.html( this.template({ data: data}) );
  },

  resultClicked: function(e) {
    var target = $(e.currentTarget);
    var index = target.data('index');
    var model = this.collection[index];

    Omg.location.saveItem('current_position', { lat: model.geometry.location.lat(), lon: model.geometry.location.lng() });
    Omg.router.navigate('#/map');
  }

});