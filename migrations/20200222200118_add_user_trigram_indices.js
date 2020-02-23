exports.up = async knex => {
  await knex.raw(`
    CREATE INDEX IF NOT EXISTS user_first_name_trgm_idx ON "user" USING GIN (first_name gin_trgm_ops);
    CREATE INDEX IF NOT EXISTS user_last_name_trgm_idx ON "user" USING GIN (last_name gin_trgm_ops);
    CREATE INDEX IF NOT EXISTS user_email_trgm_idx ON "user" USING GIN (email gin_trgm_ops);
  `);
};

exports.down = async knex => {
  throw Error("Down migrations not supported");
};
