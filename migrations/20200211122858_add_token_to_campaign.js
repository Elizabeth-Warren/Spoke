exports.up = async knex => {
  await knex.schema.alterTable("campaign", table => {
    table
      .string("join_token")
      .nullable()
      .unique();
  });
};

exports.down = async knex => {
  throw Error("Down migrations not supported");
};
