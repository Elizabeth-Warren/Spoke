const fs = require("fs");

exports.up = async knex => {
  const initalSchema = fs.readFileSync(
    `${__dirname}/initial_db_dump.sql`,
    "utf8"
  );
  // await knex.raw(initalSchema);
  console.log(
    "Not running anything, uncomment me once this has run once in dev and prod"
  );
};

exports.down = async knex => {
  throw Error("Down migrations not supported");
};
