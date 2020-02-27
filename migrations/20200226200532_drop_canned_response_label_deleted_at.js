exports.up = async knex => {
  await knex.schema.alterTable("canned_response_label", table => {
    table.dropColumn("deleted_at");
  });
};

exports.down = async knex => {
  throw Error("Down migrations not supported");
};
