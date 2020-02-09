const r = require("./build/server/server/models").r;

module.exports.handler = async function(event, context) {
  console.log("Beginning preflight...");
  try {
    await r.knex.migrate.latest();
  } catch (e) {
    console.log("Preflight failed with exception", e);
    throw e;
  }
  console.log("All done...");
};
