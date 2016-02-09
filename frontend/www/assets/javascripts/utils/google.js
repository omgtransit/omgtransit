Omg.Google = {
  initialize: function() {
    
    $('.btn-google-auth').on('click', function(e) {
      logEvent('Click', 'event', 'Account', 'Login Google');
      e.preventDefault();

      Omg.Google.authorize({
          client_id: '',
          client_secret: '',
          redirect_uri: 'http://localhost',
          scope: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile'
      }).done(function(data) {
        Omg.user.createGoogle(data);
      }).fail(function(data) {
        console.log('Error', data.error);
      });
    });
  },

  authorize: function(options) {
    var deferred = $.Deferred();

    //Build the OAuth consent page URL
    var authUrl = 'https://accounts.google.com/o/oauth2/auth?' + $.param({
        client_id: options.client_id,
        redirect_uri: options.redirect_uri,
        response_type: 'code',
        scope: options.scope
    });

    //Open the OAuth consent page in the InAppBrowser
    var authWindow = window.open(authUrl, '_blank', 'location=yes,toolbar=yes');
    //The recommendation is to use the redirect_uri "urn:ietf:wg:oauth:2.0:oob"
    //which sets the authorization code in the browser's title. However, we can't
    //access the title of the InAppBrowser.
    //
    //Instead, we pass a bogus redirect_uri of "http://localhost", which means the
    //authorization code will get set in the url. We can access the url in the
    //loadstart and loadstop events. So if we bind the loadstart event, we can
    //find the authorization code and close the InAppBrowser after the user
    //has granted us access to their data.
    $(authWindow).on('loadstart', function(e) {
      
        var url = e.originalEvent.url;
        var code = /\?code=(.+)$/.exec(url);
        var error = /\?error=(.+)$/.exec(url);
        
        if (code || error) {
          //Always close the browser when match is found
          setTimeout( function() { 
            authWindow.close();
          }, 500);
        }

        if (code) {
          //Exchange the authorization code for an access token
          $.post('https://accounts.google.com/o/oauth2/token', {
              code: code[1],
              client_id: options.client_id,
              client_secret: options.client_secret,
              redirect_uri: options.redirect_uri,
              grant_type: 'authorization_code'
          }).done(function(data) {
              deferred.resolve(data);
          }).fail(function(response) {
              deferred.reject(response.responseJSON);
          });
        } else if (error) {
          //The user denied access to the app
          deferred.reject({
              error: error[1]
          });
        }
    });

    return deferred.promise();
  }
};