class HomeController < ApplicationController
  
  skip_before_filter :verify_authenticity_token, :only => [:table]

  def index
    render :file => File.join(Rails.root, 'www', 'index.html'), :layout => false
  end

  def fav
  end

  def table
    #First we'll see if there are any stops within 10 miles of the user
    @in_bounds=true
    params[:radius] = 10
    bounds_stops = Stop.search(params)
    #If there were no stops within 10 miles, probably the user is not part
    #of our service area. Make a note of this and give them a default location.
    if bounds_stops.results.count<4
      @in_bounds=false
      params[:lat]= 44.980522382993826
      params[:lon]=-93.27006340026855
    end

    #Use the user's location and find all stops within 1 mile of it
    params[:radius] = 1
    @stops = Stop.search(params)
    @lat=params[:lat]
    @lon=params[:lon]

    respond_to do |format|
      format.html { render :layout => false }
      format.json { render :json => { in_bounds: @in_bounds, stops: @stops.results }}
    end
  end
end
