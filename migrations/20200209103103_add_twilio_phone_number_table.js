exports.up = async knex => {
  await knex.schema.createTable("twilio_phone_number", table => {
    table.string("sid").primary();
    table.string("phone_number").notNullable();
    table
      .string("area_code")
      .notNullable()
      .index();
    table
      .string("status")
      .notNullable()
      .index();
    table
      .integer("campaign_id")
      .unsigned()
      .nullable()
      .references("id")
      .inTable("campaign")
      .index();
    table.timestamp("reserved_at").nullable();
    table.timestamp("created_at").default(knex.raw("CURRENT_TIMESTAMP"));
  });
};

exports.down = async knex => {
  throw Error("Down migrations not supported");
};
