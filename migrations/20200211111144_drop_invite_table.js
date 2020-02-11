exports.up = async knex => {
  await knex.schema.dropTable("invite");
};

exports.down = async knex => {
  throw Error("Down migrations not supported");
};
