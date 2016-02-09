/*
|----------------------------------------------------------------------------------------------------
| UserModel
|----------------------------------------------------------------------------------------------------
*/

Omg.Models.User = Backbone.Model.extend({
  url:       AppConfig.backendUrl + '/users/sign_in.json',
  paramRoot: 'user',
  signedIn:  false,

  defaults: {
    "email":      "",
    "auth_token": "",
    "user_name":  ""
  },

  initialize: function() {
    this.signedIn = this.checkedSignedIn();
  },

  create: function(user_first_name, user_last_name, email, password) {
    var self = this;
    this.set({ user_first_name: user_first_name, user_last_name: user_last_name, email: email, password: password });
    

    Omg.user.save(undefined, {
      url: AppConfig.backendUrl + '/users',
      success: function(model) {
        self.setCredentials(email);
        Omg.vent.trigger('user:logged_in');
      },
      error: function(model, response) {
        console.log(response);
        Omg.vent.trigger('error:user:sign_up', JSON.parse(response.responseText) );
      }
    });
  },

  createGoogle: function(data) {
    var self = this;

    $.get(AppConfig.backendUrl + '/users/google.json', {
      access_token: data.access_token,
      id_token: data.id_token
    }, function(data) {
      console.log(data);
      if (data.success) {
        self.set('auth_token', data.auth_token);
        self.set('user_first_name',  data.user_first_name);
        self.set('user_last_name',  data.user_last_name);
        self.setCredentials(data.user_email);
        Omg.vent.trigger('user:logged_in');
      }

    });
  },

  checkedSignedIn: function() {

    // Is the key already stored in local storage?
    if (localStorage['auth_token']) {
      this.setModelFromLocalStorage();
      return true; 
    }

    // Did we get a cookie that has the key?
    if ( this.checkCookies() ) {
      return true;
    }
    
    return false;
  },

  checkCookies: function() {

    if ( typeof($.cookie('auth_token')) !== 'undefined' ) {
      // Set localstorage from cookies, and delete.
      localStorage['auth_token'] = $.cookie('auth_token');
      localStorage['user_email'] = $.cookie('user_email');
      localStorage['user_first_name']  = $.cookie('user_first_name');
      localStorage['user_last_name']  = $.cookie('user_last_name');

      $.removeCookie('auth_token');
      $.removeCookie('user_email');
      $.removeCookie('user_first_name');
      $.removeCookie('user_last_name');

      this.setModelFromLocalStorage();
      this.signedIn = true;

      Omg.vent.trigger('user:logged_in');

      return true;
    }
  },

  setModelFromLocalStorage: function() {
    this.set('auth_token', localStorage['auth_token']);
    this.set('email',      localStorage['user_email']);
    this.set('user_first_name',  localStorage['user_first_name']);
    this.set('user_last_name',  localStorage['user_last_name']);
  },

  setCredentials: function(email, token) {
    localStorage['auth_token'] = this.get('auth_token');
    localStorage['user_email'] = email;
    localStorage['user_first_name']  = this.get('user_first_name');
    localStorage['user_last_name']  = this.get('user_last_name');
    
    this.set('email', localStorage['user_email']);

    this.signedIn = true;
  },

  removeCredentials: function() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_first_name');
    localStorage.removeItem('user_last_name');
    $.removeCookie('_omg_transit_session');
    
    this.signedIn = false;
  },

  getNewSession: function(email, password) {
    var self = this;

    this.fetch({ data: { 'user[email]': email, 'user[password]': password }, type: 'POST',
      success: function(model) {
        if ( self.get('success') ) {
          self.setCredentials(email);
          Omg.vent.trigger('user:logged_in');
        } else {
          Omg.vent.trigger('error:user:logged_in');
        }
      },
      error: function(model, response) {
        Omg.vent.trigger('error:user:sign_up', response.responseJSON);
      }
    });
  },

  logout: function() {
    this.removeCredentials();
    Omg.vent.trigger('user:logged_out');
  }

});