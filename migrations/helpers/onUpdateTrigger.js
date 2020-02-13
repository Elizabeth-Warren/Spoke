// from: https://stackoverflow.com/a/48028011
module.exports = function onUpdateTrigger(table) {
  return `
    CREATE TRIGGER ${table}_updated_at
    BEFORE UPDATE ON ${table}
    FOR EACH ROW
    EXECUTE PROCEDURE on_update_timestamp();
  `;
};
