exports.up = async knex => {
  await knex.schema.dropTable("pending_message_part");
  await knex.schema.dropTable("user_cell");
};

exports.down = async knex => {
  throw Error("Down migrations not supported");
};
