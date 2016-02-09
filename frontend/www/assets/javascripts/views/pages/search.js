Omg.Views.Search = Backbone.Marionette.ItemView.extend({
  template:  JST['_jst/pages/search.html'],
  className: 'search-container',

  events: {
    'click .btn-search': 'searchClicked'
  },

  onShow: function() {
    this.searchButton = this.$el.find('.btn-search');
    this.errorMessage = this.$el.find('.alert-danger');
    this.searchInput = this.$el.find('#q');
    this.searchResults = new Omg.Views.SearchResults({ el: this.$el.find('.search-results') });
  },

  searchClicked: function() {
    var address = this.searchInput.val();
    var self = this;

    if (address === '') {
      this.errorMessage.html('Search term cannot be blank.')
      this.errorMessage.show();
      return;
    } else {
      this.errorMessage.hide();
    }

    this.searchButton.html('<i class="icon-spinner spinner"></i> Searching...');

    // Analytics call.
    var virtual_search = '/virtual/address_search.php?q='+encodeURI(address);
    logEvent('Search Box', 'pageview', virtual_search);

    Omg.location.geocode(address).then(function(results) {
      self.searchResults.render(results);
      self.searchButton.html('Search');
    }).fail(function(err) {
      self.errorMessage.html('Unable to determine address.');
      self.errorMessage.show();
      self.searchButton.html('Search');
    });
  }

});