const seedZipCodes = require("../src/server/seeds/seed-zip-codes").seedZipCodes;
const runMigrations = require("../src/migrations").runMigrations;
const createTablesIfNecessary = require("../src/server/models")
  .createTablesIfNecessary;

process.env.RETHINK_KNEX_FORCE_INDEXCREATION = "1";

async function migrate() {
  console.log("Beginning migrations...");
  try {
    await createTablesIfNecessary();
    await runMigrations();
    await seedZipCodes();
    console.log("All done!");
  } catch (e) {
    console.log("Error running migrations", e);
  }
}

migrate().then(() => process.exit());
