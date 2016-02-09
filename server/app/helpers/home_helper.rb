module HomeHelper
  def determine_user_name(user)
    (user.email.blank?) ? user.name : user.email
  end
end
