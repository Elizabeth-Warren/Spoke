const onUpdateTrigger = require("./helpers/onUpdateTrigger");

exports.up = async knex => {
  await knex.schema.dropTable("job_request");

  // from: https://stackoverflow.com/a/48028011
  await knex.raw(`
    CREATE OR REPLACE FUNCTION on_update_timestamp()
    RETURNS trigger AS $$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
  $$ language 'plpgsql';
  `);

  await knex.schema.createTable("background_job", table => {
    table.increments("id");
    table.integer("campaign_id").index();
    table.integer("organization_id").index();
    table.integer("user_id").index();

    table.string("type").notNullable();
    table.text("config").notNullable();

    table.text("result_message");
    table
      .float("progress")
      .notNullable()
      .defaultTo(0);
    table
      .string("status")
      .notNullable()
      .defaultTo("PENDING");

    table
      .datetime("created_at")
      .notNullable()
      .defaultTo(knex.raw("now()"));
    table
      .datetime("updated_at")
      .notNullable()
      .defaultTo(knex.raw("now()"));

    table
      .foreign("campaign_id")
      .references("id")
      .inTable("campaign");

    table
      .foreign("organization_id")
      .references("id")
      .inTable("organization");

    table
      .foreign("user_id")
      .references("id")
      .inTable("user");
  });

  await knex.raw(onUpdateTrigger("background_job"));
};

exports.down = async () => {
  throw Error("Down migrations not supported");
};
