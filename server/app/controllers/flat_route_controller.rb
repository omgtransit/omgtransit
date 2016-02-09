class FlatRouteController < ApplicationController
  respond_to :html, :json

  def show
    @route = FlatRoute.get_stop_list(params[:id])
    respond_with(@route)
  end
end
