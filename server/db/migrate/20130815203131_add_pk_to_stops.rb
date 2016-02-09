class AddPkToStops < ActiveRecord::Migration
  def up
    execute "ALTER TABLE stops DROP CONSTRAINT stops_pkey;ALTER TABLE stops ADD PRIMARY KEY (id);"
  end

  def down
    execute "ALTER TABLE stops DROP CONSTRAINT stops_pkey;"
  end
end
