class CreateCalendars < ActiveRecord::Migration
  def up
    create_table :calendars, id: false do |t|
      t.string :id #source_id, service_id
      t.integer :source_id
      t.string :service_id
      t.boolean :monday
      t.boolean :tuesday
      t.boolean :wednesday
      t.boolean :thursday
      t.boolean :friday
      t.boolean :saturday
      t.boolean :sunday
      t.date :start_date
      t.date :end_date

      t.timestamps
    end
    execute "ALTER TABLE calendars ADD PRIMARY KEY (id);"
  end

  def down
    drop_table :calendars
  end
end
