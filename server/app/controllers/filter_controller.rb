class FilterController < ApplicationController
  
  before_filter :authenticate_user_from_token!
  respond_to :json

  def index
    filters = Filter.where({ user_id: current_user.id })
    respond_with(filters.first)
  end

  def show
    index
  end

  def create
    filter = Filter.new({ user_id: current_user.id, filter_types: params[:filters].join(', ') })
    filter.save
    respond_with(filter)
  end

  def update

    if params[:filters].nil?
      filter = Filter.where({ user_id: current_user.id })
      
      unless filter.empty?
        filter.first.destroy
        respond_with(filter)
      end
    else
      filter = Filter.where({ user_id: current_user.id }).first
      filter.filter_types = params[:filters].join(', ')
      filter.save
      respond_with(filter)
    end

  end

end