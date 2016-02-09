class Calendar < ActiveRecord::Base
  attr_accessible :id, :end_date, :friday, :monday, :saturday, :service_id, :source_id, :start_date, :sunday, :thursday, :tuesday, :wednesday

  def self.get_service_ids
    sql = "CURRENT_TIMESTAMP >= to_date(calendars.start_date, 'YYYYMMDD') and CURRENT_TIMESTAMP <= to_date(calendars.end_date, 'YYYYMMDD') and #{Date.today.strftime("%A").downcase} = '1'"
    where(sql)
  end
end