exports.up = async knex => {
  await knex.schema.alterTable("message", table => {
    table.text("attachments").nullable();
  });
};

exports.down = async knex => {
  throw Error("Down migrations not supported");
};
