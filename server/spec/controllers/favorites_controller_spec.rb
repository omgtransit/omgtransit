require 'spec_helper'

describe FavoriteController do
  
  before(:each) do
    request.env["HTTP_ACCEPT"] = 'application/json'    
    @params = { :format => 'json' }
    @user = create(:favorite_user, favorite_count: rand(1..10))
    sign_in @user
  end

  describe "GET index" do  
    it "returns a list of favorites for the current user" do
      
      get :index, @params

      json = JSON.parse(response.body)
      expect(json.length).to equal(Favorite.all.count)
    end
  end

  describe "GET show" do  
    it "returns a favorite for the current user, for a given stop" do
      user_fav = User.first.favorites.first
      @params = {
        :format => 'json',
        :id => user_fav.stop_id
      }

      get :show, @params

      json = JSON.parse(response.body)
      expect(json['stop_id']).to eq(user_fav.stop_id)
    end
  end

  describe "POST create" do  
    it "creates a new favorite for the current user" do

      user_fav = User.first.favorites.first
      fav_count = User.first.favorites.count
      
      stop = create(:stop)

      @params = {
        :format => 'json',
        :stop_id => stop.id
      }

      post :create, @params
      json = JSON.parse(response.body)
      
      expect(json['stop_id']).to eq(stop.id)
      expect(User.first.favorites.count).to equal(fav_count+1)
    end
  end

  describe "POST destroy" do  
    it "creates a new favorite for the current user" do

      user_fav = User.first.favorites.first
      fav_count = User.first.favorites.count

      @params = {
        :format => 'json',
        :id => user_fav.stop_id
      }

      delete :destroy, @params
      
      expect(response.status).to equal(204)
      expect(User.first.favorites.count).to equal(fav_count-1)
    end
  end

end