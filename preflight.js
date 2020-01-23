const seedZipCodes = require("./build/server/server/seeds/seed-zip-codes")
  .seedZipCodes;
const runMigrations = require("./build/server/migrations").runMigrations;
const createTablesIfNecessary = require("./build/server/server/models")
  .createTablesIfNecessary;

module.exports.handler = function(event, context, callback) {
  createTablesIfNecessary().then(function(tables) {
    if (!tables) return callback(); // Early Return

    tables
      .then(runMigrations)
      .then(seedZipCodes)
      .then(callback)
      .catch(err => console.error(err));
  });
};
