exports.up = async knex => {
  await knex.schema.alterTable("campaign", table => {
    table.timestamp("started_at").nullable();
  });
};

exports.down = async knex => {
  throw Error("Down migrations not supported");
};
