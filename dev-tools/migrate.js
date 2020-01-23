const seedZipCodes = require("../src/server/seeds/seed-zip-codes").seedZipCodes;
const runMigrations = require("../src/migrations").runMigrations;
const createTablesIfNecessary = require("../src/server/models")
  .createTablesIfNecessary;

async function migrate() {
  console.log("Beginning migrations...");

  await createTablesIfNecessary();
  await runMigrations();
  await seedZipCodes();
  console.log("All done!");
}

migrate().then(() => process.exit());
