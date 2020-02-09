exports.up = async knex => {
  await knex.schema.dropTable("log");
};

exports.down = async knex => {
  throw Error("Down migrations not supported");
};
