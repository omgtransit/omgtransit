require 'omniauth'
require 'omniauth-google-oauth2'

# Use this hook to configure devise mailer, warden hooks and so forth.
# Many of these configuration options can be set straight in your model.
Devise.setup do |config|
  # ==> Mailer Configuration
  # Configure the e-mail address which will be shown in Devise::Mailer,
  # note that it will be overwritten if you use your own mailer class with default "from" parameter.
  config.mailer_sender = "noreply@omgtransit.com"

  require 'devise/orm/active_record'
  config.case_insensitive_keys = [ :email ]
  config.strip_whitespace_keys = [ :email ]

  config.skip_session_storage = [:http_auth, :token_auth]
  config.stretches = Rails.env.test? ? 1 : 10
  config.reconfirmable = true
  config.remember_for = 2.weeks
  config.password_length = 8..128

  config.reset_password_within = 6.hours
  config.token_authentication_key = :auth_token

 
  config.http_authenticatable_on_xhr = false
  config.navigational_formats = ["*/*", :html, :json]

  # The default HTTP method used to sign out a resource. Default is :delete.
  #config.sign_out_via = :delete
  config.sign_out_via = :get
  config.omniauth :google_oauth2, ENV['gauth_app_id'], ENV['gauth_app_token'], { access_type: "offline", approval_prompt: "", :scope => 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile' }

  # ==> Warden configuration
  # If you want to use other strategies, that are not supported by Devise, or
  # change the failure app, you can configure them inside the config.warden block.
  #
  # config.warden do |manager|
  #   manager.intercept_401 = false
  #   manager.default_strategies(:scope => :user).unshift :some_external_strategy
  # end

  # ==> Mountable engine configurations
  # When using Devise inside an engine, let's call it `MyEngine`, and this engine
  # is mountable, there are some extra configurations to be taken into account.
  # The following options are available, assuming the engine is mounted as:
  #
  #     mount MyEngine, at: "/my_engine"
  #
  # The router that invoked `devise_for`, in the example above, would be:
  # config.router_name = :my_engine
  #
  # When using omniauth, Devise cannot automatically set Omniauth path,
  # so you need to do it manually. For the users scope, it would be:
  # config.omniauth_path_prefix = "/my_engine/users/auth"

  config.secret_key = ENV['DEVISE_SECRET_KEY']
end
