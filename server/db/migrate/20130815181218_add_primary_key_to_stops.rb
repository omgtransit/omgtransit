class AddPrimaryKeyToStops < ActiveRecord::Migration
  def up
    execute "ALTER TABLE stops DROP CONSTRAINT stops_pkey;;"
    execute "ALTER TABLE stops ADD PRIMARY KEY (stop_id);"
  end

  def up
    execute "ALTER TABLE stops DROP CONSTRAINT stops_pkey;;"
    execute "ALTER TABLE stops ADD PRIMARY KEY (id);"
  end
end
