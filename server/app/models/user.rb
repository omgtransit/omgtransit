class User < ActiveRecord::Base
  # Include default devise modules. Others available are:
  # :token_authenticatable, :confirmable,
  # :lockable, :timeoutable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :trackable, :validatable
  devise :omniauthable, :omniauth_providers => [:google_oauth2]

  # Setup accessible (or protected) attributes for your model
  attr_accessible :email, :password, :remember_me, :provider, :uid, :name, :first_name, :last_name, :car2go_token, :car2go_secret, :car2go_account, :car2go_regdate, :authentication_token

  before_save :ensure_authentication_token
  after_create :add_to_sendgrid

  def ensure_authentication_token
    if authentication_token.blank?
      self.authentication_token = generate_authentication_token
    end
  end
 
  has_many :favorites
  
  def self.find_for_google_oauth2(access_token, signed_in_resource=nil)

    data = access_token.info
    user = User.where(:email => data["email"]).first

    parsed_name = User.parse_name(data["name"])

    unless user

      user = User.create(last_name: parsed_name[:last_name],
        first_name: parsed_name[:first_name],
        name: data["name"],
        email: data["email"],
        provider: 'google',
        password: Devise.friendly_token[0,20])
    end
    user
  end

  def self.parse_name(name)
    return false unless name.is_a?(String)
    
    # First, split the name into an array
    parts = name.split
    
    # If any part is "and", then put together the two parts around it
    # For example, "Mr. and Mrs." or "Mickey and Minnie"
    parts.each_with_index do |part, i|
      if ["and", "&"].include?(part) and i > 0
        p3 = parts.delete_at(i+1)
        p2 = parts.at(i)
        p1 = parts.delete_at(i-1)
        parts[i-1] = [p1, p2, p3].join(" ")
      end
    end
    
    # Build a hash of the remaining parts
    hash = {
      :suffix => (s = parts.pop unless parts.last !~ /(\w+\.|[IVXLM]+|[A-Z]+)$/),
      :last_name  => (l = parts.pop),
      :prefix => (p = parts.shift unless parts[0] !~ /^\w+\./),
      :first_name => (f = parts.shift),
      :middle_name => (m = parts.join(" "))
    }
 
    #Reverse name if "," was used in Last, First notation.
    if hash[:first_name] =~ /,$/
      hash[:first_name] = hash[:last_name]
      hash[:last_name] = $` # everything before the match
    end
 
    return hash
  end
  
  def email_required?
    super && provider.blank?
  end

  def add_to_sendgrid
    url = "https://api.sendgrid.com/api/newsletter/lists/email/add.json"
    @result = HTTParty.post(url, 
      :body => { 
        :list => 'OMG Transit Users',
        :api_user => OmgTransit::Application.config.sendgrid_user,
        :api_key => OmgTransit::Application.config.sendgrid_password,
        :data => {
          "email" => self.email,
          "name" => self.first_name + " " + self.last_name,
          "First Name" => self.first_name,
          "Last Name" => self.last_name
        }.to_json
      }
    )
  end

  private
  
    def generate_authentication_token
      loop do
        token = Devise.friendly_token
        break token unless User.where(authentication_token: token).first
      end
    end

end
