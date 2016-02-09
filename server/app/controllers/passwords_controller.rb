class PasswordsController < DeviseController
  respond_to :json

  after_filter :cors_set_access_control_headers
  def cors_set_access_control_headers
    headers['Access-Control-Allow-Origin'] = '*'
    headers['Access-Control-Allow-Methods'] = 'POST, GET, OPTIONS'
    headers['Access-Control-Max-Age'] = "1728000"
  end

  before_filter :cors_preflight_check
  def cors_preflight_check
    if request.method == "OPTIONS"
      headers['Access-Control-Allow-Origin'] = '*'
      headers['Access-Control-Allow-Methods'] = 'POST, GET, OPTIONS'
      headers["Access-Control-Allow-Headers"] = %w{Origin Accept Content-Type X-Requested-With X-CSRF-Token X-Prototype-Version}.join(",")
      headers['Access-Control-Max-Age'] = '1728000'
      render :text => '', :content_type => 'text/plain'
    end
  end

  def create
    @user = User.find_by_email(params['password']['email'])
    unless @user.nil?
      if @user.provider.nil?
        @user.send_reset_password_instructions
        if successfully_sent?(@user)
          cors_set_access_control_headers
          render :status => 201, :json => { created: true }
        else
          cors_set_access_control_headers
          render :status => 422, :json => { :errors => @user.errors.full_messages }
        end
      else
        cors_set_access_control_headers
        render :status => :unauthorized, :json => { :errors => ["Can't reset password on a google associated email."] }
      end
    else
      cors_set_access_control_headers
      render :json => { :errors => ["Invalid email"] },  :success => false, :status => :unauthorized, :head => :ok
    end
  end
end