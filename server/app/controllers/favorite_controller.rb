class FavoriteController < ApplicationController
  
  before_filter :authenticate_user_from_token!

  respond_to :json

  def index
    favorites = Favorite.select("user_id, favorites.stop_id, stops.stop_name, 'metro_bus' as stop_type, stops.stop_url")
                        .joins([:stop])
                        .where({ user_id: current_user.id })
                        .order(:created_at)

    respond_with(favorites)                  
  end

  def show
    favorite = Favorite.where({ user_id: current_user.id, stop_id: params[:id] })
    respond_with(favorite.first)
  end

  def create
    favorite = Favorite.find_or_create_by_stop_id_and_user_id(stop_id: params[:stop_id], user_id: current_user.id)
    respond_with(favorite)
  end

  def destroy
    Favorite.destroy_all(user_id: current_user.id, stop_id: params[:id])
    respond_with({:text => '[]', :status => :ok }.to_json)
  end

  def options
  end

end