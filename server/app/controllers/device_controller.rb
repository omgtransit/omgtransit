class DeviceController < ApplicationController
  
  before_filter :authenticate_user_from_token!
  respond_to :json

  def create
    device = Device.create(user: current_user, token: params[:token], platform: params[:platform])
    respond_with(device)
  end
end