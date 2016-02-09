class Users::OmniauthCallbacksController < Devise::OmniauthCallbacksController
  skip_before_filter :verify_authenticity_token, :only => [:google_oauth2] 

  def google_oauth2

    # You need to implement the method below in your model (e.g. app/models/user.rb)
    @user = User.find_for_google_oauth2(request.env["omniauth.auth"])

    if @user.authentication_token.nil?
      @user.ensure_authentication_token 
      @user.save
    end

    cookies[:auth_token] = 
    { :value => "#{@user.authentication_token}",
      :expires => 1.days.from_now
    }

    cookies[:user_email] = 
    { :value => "#{@user.email}",
      :expires => 1.days.from_now
    }

    cookies[:user_first_name] = 
    { :value => "#{@user.first_name}",
      :expires => 1.days.from_now
    }

    cookies[:user_last_name] = 
    { :value => "#{@user.last_name}",
      :expires => 1.days.from_now
    }
    
    redirect_to root_path
  end
end