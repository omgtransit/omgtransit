class RegistrationsController < ApplicationController
  respond_to :json

  def create
    user = User.new({ :email => params[:email], :password => params[:password], :first_name => params[:user_first_name], :last_name => params[:user_last_name] })

    if user.save
      return render json: { success: true, auth_token: user.authentication_token, user_id: user.id, user_first_name: user.first_name, user_last_name: user.last_name }, :status => 201
    else
      warden.custom_failure!
      render :json => user.errors, :status => 422
    end
  end

  def user_params
    params.require(:registration).permit(:email, :password, :first_name, :last_name)
  end

end