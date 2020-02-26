exports.up = async knex => {
  await knex.schema.createTable("label", table => {
    table.increments();
    table
      .integer("organization_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("organization")
      .index();
    table.text("group").nullable();
    table.text("display_value").notNullable();
    table
      .text("slug")
      .notNullable()
      .index();
    table
      .integer("created_by")
      .unsigned()
      .nullable()
      .references("id")
      .inTable("user");
    table
      .timestamp("created_at")
      .notNullable()
      .default(knex.raw("CURRENT_TIMESTAMP"));
    table
      .timestamp("deleted_at")
      .nullable()
      .default(null);
    table.unique(["organization_id", "group", "display_value"]);
    table.unique(["organization_id", "slug"]);
  });

  await knex.schema.createTable("canned_response_label", table => {
    table.increments();
    table
      .integer("canned_response_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("canned_response")
      .index();
    table
      .integer("label_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("label")
      .index();
    table
      .timestamp("created_at")
      .notNullable()
      .default(knex.raw("CURRENT_TIMESTAMP"));
    table
      .timestamp("deleted_at")
      .nullable()
      .default(null);
    table.unique(["canned_response_id", "label_id"]);
  });
};

exports.down = async knex => {
  // throw Error("Down migrations not supported"); // TODO: matteo: uncomment before merging to master
  await knex.schema.dropTable("canned_response_label");
  await knex.schema.dropTable("label");
};
