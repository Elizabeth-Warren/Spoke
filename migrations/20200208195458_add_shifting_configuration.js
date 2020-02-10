exports.up = async function(knex, Promise) {
  await knex.schema.alterTable("campaign", table => {
    table.text("shifting_configuration").nullable();
  });
};

exports.down = function(knex, Promise) {};
