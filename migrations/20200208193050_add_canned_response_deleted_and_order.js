exports.up = async function(knex) {
  await knex.schema.alterTable("canned_response", table => {
    table
      .boolean("deleted")
      .notNullable()
      .default(false);
    table
      .integer("order")
      .notNullable()
      .default(0);
  });
  console.log("added canned_response deleted and order columns");
};

exports.down = function(knex) {
  throw Error("Down migrations not supported");
};
