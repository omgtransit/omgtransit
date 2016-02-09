class SessionsController < Devise::SessionsController 
  skip_before_filter :require_no_authentication

  def create
    resource = warden.authenticate!(scope: resource_name, recall: "#{controller_path}#failure")

    if resource.provider.nil?  
      sign_in(resource_name, resource)
      return render json: { success: true, auth_token: resource.authentication_token, user_id: resource.id, user_name: resource.name, user_first_name: resource.first_name, user_last_name: resource.last_name }
    else
      render :json => { :errors => ["Invalid account. It looks like your account is accociated with google."] },  :success => false, :status => :unauthorized
    end
    
  end

  def create_google_oauth2

    if params["id_token"].nil? || params["access_token"].nil?
      return invalid_login_attempt
    end

    raw_response = HTTParty.get('https://www.googleapis.com/oauth2/v1/userinfo',
      query: {
        :id_token => params["id_token"],
        :access_token => params["access_token"]
      }
    )

    user = User.where(:email => raw_response['email']).first
    parsed_name = User.parse_name(raw_response["name"])

    unless user
      user = User.create(
        last_name: parsed_name[:last_name],
        first_name: parsed_name[:first_name],
        email: raw_response["email"],
        provider: 'google',
        password: Devise.friendly_token[0,20]
      )
    else
      if user.authentication_token.nil?
        user.ensure_authentication_token 
        user.save
      end
    end

    render :json => {
      success: true,
      :auth_token => user.authentication_token,
      user_id: user.id,
      user_name: user.name,
      user_email: user.email,
      user_first_name: user.first_name,
      user_last_name: user.last_name
    }

  end

  def destroy
    @user=User.where(:authentication_token=>params[:auth_token]).first
    @user.reset_authentication_token!
    render :json => { :message => ["Session deleted."] },  :success => true, :status => :ok
  end

  def invalid_login_attempt
    warden.custom_failure!
    render :json => { :errors => ["Invalid email or password."] },  :success => false, :status => :unauthorized
  end

  def failure
    render :json => {:success => false, :errors => ["Login Failed"]}
  end
end