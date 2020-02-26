exports.up = async knex => {
  await knex.schema.createTable("notification", table => {
    table.increments();

    table
      .text("email")
      .notNullable()
      .index();
    table
      .integer("user_id")
      .notNullable()
      .references("id")
      .inTable("user");
    table.text("notification_type").notNullable();
    table.jsonb("data");

    table
      .timestamp("created_at")
      .notNullable()
      .default(knex.raw("CURRENT_TIMESTAMP"))
      .index();
  });
};

exports.down = async knex => {
  throw Error("Down migrations not supported");
};
