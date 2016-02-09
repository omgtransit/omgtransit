Omg.Views.Filter = Backbone.Marionette.ItemView.extend({
  className: 'filter-container',
  template: JST['_jst/pages/filter.html'],

  events: {
    'click button': 'filterChanged',
    'click .btn-secondary': 'clearFilters'
  },

  initialize: function() {
    this.model = Omg.filters;
  },

  onShow: function() {
    var self = this;
    this.model.getFilters(function() {
      self.render();
    });
  },

  filterChanged: function(e) {
    var target = $(e.target);
    var parent = target.parent();
    var values = target.data('types');
    var filters = Omg.filters.get('filters');
    
    if ( parent.hasClass('active') ) {
      // Remove filter
      filters = _.difference( filters, values );
      parent.removeClass('active');
    } else {
      // Add filter
      filters = _.union( filters, values );
      parent.addClass('active');
    }
    
    Omg.filters.setFilters(filters);
  },

  clearFilters: function(e) {
    e.preventDefault();
    Omg.filters.setFilters([]);
    this.$el.find('li.active').removeClass('active');
  }

});