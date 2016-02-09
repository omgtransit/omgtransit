class StopController < ApplicationController
  def cleanstop(stop)
    stop.delete :_explanation
    stop.delete :_index
    stop.delete :_score
    stop.delete :_type
    stop.delete :_version
    stop.delete :highlight
    stop.delete :sort
    puts stop.to_json
    return stop
  end

  def show
    source_id = Source.where({ name: params[:source].upcase }).first.id
    if not params[:contract]
      @id = "#{source_id}-#{params[:id]}"
    else
      @id = "#{source_id}-#{params[:contract]}/#{params[:id]}"
    end

    @stop = Stop.get_stop_by_id({ :id => @id }).results.first
    @lat = @stop.location[1]
    @lon = @stop.location[0]

    @stop = cleanstop(@stop.to_hash)

    respond_to do |format|
      format.html { render :layout => false }
      format.json { render :json => @stop.to_json }
    end
  end

  def bounds
    #Each degree of latitude is ~69 miles from another
    if    (params[:n].to_f-params[:s].to_f).abs*69>30
      @stop = [] #They are trying to see too large an area

    #Each degree of longitude is 69*cos(Latitude) miles apart
    elsif (params[:e].to_f-params[:w].to_f).abs*69*Math.cos(params[:n].to_f*3.14159/180)>30
      @stop = [] #They are trying to see too large an area

    else
      @stop = Stop.get_stop_by_bounds(params[:n], params[:s], params[:e], params[:w], params[:centerLat], params[:centerLng])
      @stop = @stop.map{ |i| {
        :lon=>i['location'][0],
        :lat=>i['location'][1],:id=>i['id'],
        :name => i['stop_name'],
        :stop_type => i['stop_type'],
        :stop_url => i['stop_url'],
        :realtime=>i.to_json.to_s }
      }
      @stop = @stop.map{ |i| cleanstop(i.to_hash) }
    end

    respond_to do |format|
      format.json { render :json => @stop }
    end
  end

  def get_stop_neighbours
    @neighbours=StopTime.get_stop_neighbours(params[:stop_id], params[:route_id])

    stop_index = @neighbours.index {|a| a.id==params[:stop_id]}

    #Get the 4 stops before and the 4 stops after this one
    @neighbours=@neighbours[ [stop_index-4,0].max .. [stop_index+4,@neighbours.length].min ]

    respond_to do |format|
      format.json { render :json=> @neighbours }
    end
  end

  def arrivals
    @arrivals=StopTime.arrivals(params[:stopid])

    puts :stopid
    puts "========================"
    puts @arrivals

    respond_to do |format|
      format.json { render :json=>@arrivals}
    end
  end

  def closest_trip
    
    # shape_array = []

    s = StopTime.get_closest_trip(params[:stop_id], params[:route])

    unless s.blank?
      #shape = Shape.encode_to_polylines(s.first.shape_id.to_s)
      shape = ShapesGoogleEncoded.select('shape_id, encoded_polyline').find_by_shape_id(s.first.shape_id.to_s)
      puts shape
      # shape_array << {
      #   :encoded_shape => shape
      # }
    end

    respond_to do |format|
      format.json { render :json => shape, :status => :ok }
    end
  end
end
