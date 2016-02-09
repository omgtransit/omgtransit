#See: https://github.com/oauth-xx/oauth-ruby
#TODO(Richard): Remove unnecessary puts
class Car2goController < ApplicationController

  append_before_filter :run_filters
  respond_to :json

  @test = 1

  def run_filters
    authenticate_user_from_token!
    if current_user.nil?
      return
    end
    setup_tokens
  end

  def setup_tokens
    @consumer=OAuth::Consumer.new("OMGTransit", ENV['CAR2GO_API_KEY'], {
        :site               => "https://www.car2go.com",
        :request_token_path => '/api/reqtoken',
        :authorize_path     => "/api/authorize",
        :access_token_path  => "/api/accesstoken",
        :nonce              => Base64.encode64(OpenSSL::Random.random_bytes(20)).gsub(/\W/, '')
      })

    if (current_user.car2go_token and current_user.car2go_token.strip.length>0)
      @access_token = OAuth::AccessToken.new(@consumer, current_user.car2go_token, current_user.car2go_secret)
    else
      @access_token = false
    end
  end

  def getreq(req_type, addy, params, resp_str, details_str)
    begin
      if req_type==:get
        resp=@access_token.get(addy)
      elsif req_type==:post
        resp=@access_token.post(addy, params)
      elsif req_type==:delete
        resp=@access_token.delete(addy)
      end
    rescue OAuth::Problem => e
      if e.message=='signature_invalid'
        render :json => {:status=>"no_car2go_access"} and return
      else
        render :json => {:status=>"not_granted"} and return
        logger.error 'AAAHHHHH! Car2Go auth is failing in an unknown way!'
      end
    end
    resp=Hash.from_xml(resp.body)
    puts resp.to_json
    resp=resp[resp_str]
    code=resp['returnValue']['code']
    desc=resp['returnValue']['description']
    if not code=='0'
      render :json => {:status=>"error",   :details=>desc} and return
    elsif resp[details_str]
      render :json => {:status=>"success", :details=>resp[details_str]} and return
    else
      render :json => {:status=>"nil", :details=>""} and return
    end
  end

  def doauth
    #TODO (from Richard): Do something if this fails.
    puts "Fetching request token"
    @request_token=@consumer.get_request_token
    #session[:car2go_token]=@request_token

    agent = Mechanize.new
    
    #TODO (from Richard): Do something if this fails.
    agent.get(@request_token.authorize_url)

    puts "Logging user in"    
    agent.page.forms[0]["j_username"]=params[:username]
    agent.page.forms[0]["j_password"]=params[:password]
    agent.page.forms[0].submit

    if agent.page.uri.path=='/api/loginerror'
      render :json => {:status=>"bad_login"} and return
    end

    puts "Granting OMG Transit access"
    agent.click(agent.page.link_with(:text => /Grant/))

    oauth_verifier = Rack::Utils.parse_nested_query(agent.page.uri.query)['oauth_verifier']

    if oauth_verifier.nil?
      logger.error 'Car2Go failed to reach login page!'
      render :json => {:status=>"not_granted"} and return
    end      

    #TODO (from Richard): Do something if this fails.
    puts "Getting access token"
    @access_token  = @request_token.get_access_token(:oauth_verifier => oauth_verifier)


    #TODO (from Richard): This pretty much screws our European users and who knows its ultimate ramifications, but it should work for most U.S. users
    puts "Getting account info"
    account=@access_token.get("https://www.car2go.com/api/v2.1/accounts?loc=Minneapolis")

    puts "Processing account info"
    account=Hash.from_xml(account.body)['accountResponse']
    code=account['returnValue']['code']
    desc=account['returnValue']['description']
    if not code=='0'
      render :json => {:status=>"account_error", :error=>desc} and return
    end

    puts "Saving Car2Go info"
    current_user.car2go_token   = @access_token.token
    current_user.car2go_secret  = @access_token.secret
    current_user.car2go_regdate = DateTime.now
    current_user.car2go_account = account['account']['accountId']
    current_user.save

    render :json => {:status=>"success"} and return
  end

  #Reserves a car for a user
  def reserve
    if not @access_token
      render :json => {:status=>"no_car2go_access"} and return
    end

    puts "Endeavouring to make Car2Go Reservation"
    getreq :post, "https://www.car2go.com/api/v2.1/bookings", {:loc=>'Minneapolis', :test=>@test, :vin=>params[:carid], :account=>current_user.car2go_account}, 'bookingResponse', 'booking'
  end

  #Shows which cars the user has reserved
  def bookings
    puts @access_token.to_json
    if not @access_token
      render :json => {:status=>"no_car2go_access"} and return
    end

    puts "Getting Car2Go reservation information"
    getreq :get, "https://www.car2go.com/api/v2.1/bookings?loc=Minneapolis", {:test=>@test}, 'bookingResponse', 'booking'
  end

  #Cancels a user's existing
  def cancel
    if not @access_token
      render :json => {:status=>"no_car2go_access"} and return
    end

    puts "Canceling a Car2Go Reservation"
    getreq :delete, "https://www.car2go.com/api/v2.1/booking/#{params[:bookingid]}", {:test=>@test}, 'cancelBookingResponse', 'cancelBooking'
  end
end
