exports.up = async knex => {
  await knex.schema.alterTable("message", table => {
    table
      .timestamp("created_at")
      .alter()
      .notNullable()
      .default(knex.raw("CURRENT_TIMESTAMP"))
      .index();
  });
};

exports.down = async knex => {
  throw Error("Down migrations not supported");
};
