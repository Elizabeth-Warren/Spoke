exports.up = async knex => {
  await knex.schema.alterTable("opt_out", async table => {
    await table
      .integer("assignment_id")
      .alter()
      .nullable();
  });
};

exports.down = async knex => {
  throw Error("Down migrations not supported");
};
