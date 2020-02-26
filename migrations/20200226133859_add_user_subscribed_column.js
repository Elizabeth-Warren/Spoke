exports.up = async knex => {
  await knex.schema.alterTable("user", async table => {
    table
      .boolean("subscribed_to_reminders")
      .notNullable()
      .default(true);
  });
};

exports.down = async knex => {
  throw Error("Down migrations not supported");
};
