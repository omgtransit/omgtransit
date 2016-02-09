class ApplicationController < ActionController::Base
  protect_from_forgery

  def protect_against_forgery?
    unless request.format.json?
      super
    end
  end

  #TODO(Richard): Restrict this prior to relase of app
  after_filter :cors_set_access_control_headers
  def cors_set_access_control_headers
    headers['Access-Control-Allow-Origin'] = '*'
    headers['Access-Control-Allow-Methods'] = 'POST, GET, OPTIONS, DELETE, PUT'
    headers['Access-Control-Max-Age'] = "1728000"
  end

  before_filter :cors_preflight_check
  # If this is a preflight OPTIONS request, then short-circuit the
  # request, return only the necessary headers and return an empty
  # text/plain.

  #TODO(Richard): Restrict this prior to relase of app
  def cors_preflight_check
    if request.method == "OPTIONS"
      headers['Access-Control-Allow-Origin'] = '*'
      headers['Access-Control-Allow-Methods'] = 'POST, GET, OPTIONS, DELETE, PUT'
      headers["Access-Control-Allow-Headers"] = %w{Origin Accept Content-Type X-Requested-With X-CSRF-Token X-Prototype-Version}.join(",")
      headers['Access-Control-Max-Age'] = '1728000'
      render :text => '', :content_type => 'text/plain'
    end
  end

  
  def authenticate_user_from_token!
    user_email = params[:user_email].presence
    user       = user_email && User.find_by_email(user_email)
 
    # Notice how we use Devise.secure_compare to compare the token
    # in the database with the token given in the params, mitigating
    # timing attacks.
    if user && Devise.secure_compare(user.authentication_token, params[:user_token])
      sign_in user, store: false
    else
      cors_set_access_control_headers
      render :json => { :errors => ["Invalid email or password."] },  :success => false, :status => :unauthorized, :head => :ok
    end
  end
end
