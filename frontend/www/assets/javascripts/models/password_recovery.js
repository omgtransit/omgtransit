/*
|----------------------------------------------------------------------------------------------------
| PasswordRecoveryModel
|----------------------------------------------------------------------------------------------------
*/

Omg.Models.PasswordRecovery = Backbone.Model.extend({
  url: AppConfig.backendUrl + '/users/passwords.json',
  paramRoot: 'user',

  defaults: {
    "email": ""
  }
});