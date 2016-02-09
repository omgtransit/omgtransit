class AlertController < ApplicationController
  
  before_filter :authenticate_user_from_token!, :except => [:cleanup, :update]
  respond_to :json

  def index
    whereClause = { user_id: current_user.id }
    
    if params[:platform]
      whereClause[:platform] = params[:platform]
    end

    alerts = Mongo::Alert.where(whereClause).sort( { alert_time: -1 } )
    alerts = alerts.entries.map {|model| model.attributes.merge(:id => model._id) }
    respond_with(alerts.entries.to_json)
  end

  def show
    alerts = Mongo::Alert.where({ user_id: current_user.id, stop_id: params[:id] })
    respond_with(alerts)
  end

  def update
    Mongo::Alert.find(params[:id]).update_attribute(:last_recurring_at, DateTime.now.utc)
    respond_with({:text => '[]', :status => :ok }.to_json)
  end

  def create
    alertRow = Mongo::Alert.where({ 
      user_id: current_user.id,
      realtime_url: params[:realtime_url],
      alert_time: params[:alert_time],
      device_token: params[:device_token],
      route: params[:route],
      platform: params[:platform]
    })

    if alertRow.entries.empty?
      alert = Mongo::Alert.create({
        stop_id: params[:stop_id], 
        user_id: current_user.id,
        offset: params[:offset],
        realtime_url: params[:realtime_url],
        alert_time: params[:alert_time],
        start_time: params[:start_time],
        device_token: params[:device_token],
        route: params[:route],
        platform: params[:platform],
        stop_name: params[:stop_name],
        recurring: params[:recurring],
        recurring_days: params[:recurring_days]
      })

      respond_with(alert)
    else
      render json: ''
    end
   
  end

  def destroy
    alert = Mongo::Alert.where({ :id => params[:id], :user_id => current_user.id })
    unless alert.entries.empty?
      Mongo::Alert.where({ :id => params[:id] }).delete
      respond_with({:text => '[]', :status => :ok }.to_json)
    else
      render :json => { :message => ["Alert is not attached to the current user."] },  :success => true, :status => :ok
    end
  end

  def cleanup
    Mongo::Alert.where({ :id => params[:id] }).delete
    respond_with({:text => '[]', :status => :ok }.to_json)
  end

  def options
  end

end