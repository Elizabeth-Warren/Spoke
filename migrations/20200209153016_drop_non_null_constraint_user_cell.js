exports.up = async knex => {
  await knex.schema.alterTable("user", table => {
    table
      .string("cell")
      .alter()
      .nullable();
  });
};

exports.down = async knex => {
  throw Error("Down migrations not supported");
};
