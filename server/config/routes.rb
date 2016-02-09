OmgTransit::Application.routes.draw do
  
  devise_for :users, :controllers => {:omniauth_callbacks => "users/omniauth_callbacks", sessions: 'sessions', registrations: 'registrations' }
  
  devise_scope :user do
    get '/users/auth/:provider(.:format)' => 'users/omniauth_callbacks#passthru {:provider=>/google_oauth2/}', :as => :user_omniauth_callback
    
    post 'users/auth/:action/callback(.:format)' => 'users/omniauth_callbacks#(?-mix:google_oauth2)', :as => :user_omniauth_callback
    
    get '/users/omniauth_callbacks/google_oauth2/callback' => 'users/omniauth_callbacks#google_oauth2'
    get 'users/google' => 'sessions#create_google_oauth2'
    post 'users/passwords' => 'passwords#create'
  end 

  # You can have the root of your site routed with "root"
  # just remember to delete public/index.html.
  match '*all' => 'application#cors_preflight_check', :constraints => {:method => 'OPTIONS'}

  get  '/fav'                       => 'home#fav'
  get  'flat_route/:id'             => 'flat_route#show'
  post '/sms'                       => 'home#sms'
  get  'stop/closest_trip'          => 'stop#closest_trip'
  get  'stop/get_stop_neighbours'   => 'stop#get_stop_neighbours'
  get  'stop/:stopid/arrivals'      => 'stop#arrivals'
  root :to                          => 'home#index'

  # Routes to enable pushstate
  get  'route'                        => 'home#index'
  get  'map'                        => 'home#index'
  get  'help'                       => 'home#index'
  get  'stop/:source/:id'           => 'home#index'
  post 'stop/:source/:id'           => 'stop#show'

  #routing
  get "route/:id/stops"             => 'route#current_route_stops'
  get "route/shape"                 => 'route#shape'

  get  'car2go/doauth'              => 'car2go#doauth'
  get  'car2go/reserve/:carid'      => 'car2go#reserve'
  get  'car2go/bookings'            => 'car2go#bookings'
  get  'car2go/cancel/:bookingid'   => 'car2go#cancel'

  match "/404", :to => "home#not_found"

  resources :favorite, :only => [:index, :show, :update, :create, :destroy]

  # Alerts
  resources :alert, :only => [:index, :show, :update, :create, :destroy]
  resources :filter, :only => [:index, :show, :update, :create]

  delete 'alert/cleanup/:id' => 'alert#cleanup'

  resources :contribute, :only => [:index, :create]
end