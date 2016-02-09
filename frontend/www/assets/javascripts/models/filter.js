/*
|----------------------------------------------------------------------------------------------------
| AlertModel
|----------------------------------------------------------------------------------------------------
*/

Omg.Models.Filter = Backbone.Model.extend({
  urlRoot: AppConfig.backendUrl + '/filter',

  defaults: {
    'filters': []
  },

  getFilters: function(cb) {
    var self = this;
    if( Omg.user.signedIn ) {
      this.fetch({ success: function(data) {
        if( data.get('filter_types') ) {
          self.formatFilters( data.get('filter_types').split(',') );
          if(cb) {
            cb();
          }
        }
      }});
    }
  },

  hasFilter: function(filters) {
    var intersect = _.intersection(filters, this.get('filters') );

    if(intersect.length) {
      return true;
    }
    return false;
  },

  url: function() {
    var id = this.get('id');
    if (id) {
      return AppConfig.backendUrl + '/filter/' + this.get('id') + '?user_email=' + Omg.user.get('email') + '&user_token=' + Omg.user.get('auth_token')
    } else {
      return AppConfig.backendUrl + '/filter/?user_email=' + Omg.user.get('email') + '&user_token=' + Omg.user.get('auth_token')
    }
  },

  formatFilters: function(filters) {
    filters = _.map(filters, function(num){ return parseInt(num,10); })
    this.set('filters', filters);
    this.formatted = filters.join(',');
  },

  setFilters: function(filters) {
    this.formatFilters(filters);
    this.save();

    if(!filters.length) {
      this.unset('id');
    }
  }
});