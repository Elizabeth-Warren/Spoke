exports.up = async knex => {
  await knex.schema.alterTable("campaign", async table => {
    table.string("status").nullable();
    table.string("contact_file_name").nullable();
  });
};

exports.down = async knex => {
  throw Error("Down migrations not supported");
};
