exports.up = async knex => {
  await knex.raw(`
    UPDATE campaign
    SET status = CASE
      WHEN is_archived THEN 'ARCHIVED'
      WHEN is_started IS NOT TRUE THEN 'NOT_STARTED'
      WHEN is_started THEN 'ACTIVE'       
    END
    WHERE status IS NULL;
  `);

  knex.schema.alterTable("campaign", table => {
    table
      .string("status")
      .alter()
      .notNullable();
  });
};

exports.down = async knex => {
  throw Error("Down migrations not supported");
};
