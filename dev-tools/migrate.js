import { r } from "../src/server/models";

async function migrate() {
  console.log("Beginning migrations...");
  try {
    await r.knex.migrate.latest();
    console.log("All done!");
  } catch (e) {
    console.log("Error running migrations", e);
  }
}

migrate().then(() => process.exit());
