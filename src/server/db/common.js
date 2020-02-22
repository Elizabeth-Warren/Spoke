import { r } from "src/server/models/thinky";
import humps from "humps";
// Knex instance used by the db package, just an alias for thinky's connection
// for now.
// TODO[matteo]: maybe split out the connection and add post processing:
//   http://knexjs.org/#Installation-post-process-response
const knex = r.knex;

async function transaction(fn) {
  return knex.transaction(fn);
}

/**
 * Run a block of code, creating a new transaction if one isn't passed
 *
 * @param existingTransaction nullable knex transaction object
 * @param fn async function that takes a transaction as its only argument
 * @return {Promise<*>}
 */
async function withTransaction(existingTransaction, fn) {
  if (existingTransaction) {
    return await fn(existingTransaction);
  }
  return await transaction(trx => fn(trx));
}

function queryBuilder(tableName, opts) {
  const trx = opts && opts.transaction;
  const builder = trx ? trx(tableName) : r.knex(tableName);
  if (opts && opts.forUpdate) {
    return builder.forUpdate();
  }
  return builder;
}

function camelize(obj) {
  return humps.camelizeKeys(obj, { separator: "_" });
}

function camelizeFirst(aryOfObj) {
  if (aryOfObj.length === 0) {
    return null;
  }

  return camelize(aryOfObj[0]);
}

function decamelize(obj) {
  return humps.decamelizeKeys(obj, { separator: "_" });
}

function convertCase(obj, opts) {
  return opts && opts.snakeCase ? obj : camelize(obj);
}

// Generic get function
async function getAny(tableName, fieldName, fieldValue, opts = {}) {
  const result = await queryBuilder(tableName, opts)
    .where(fieldName, fieldValue)
    .first();

  return convertCase(result, opts);
}

async function insertAndReturn(tableName, fields, opts) {
  return camelizeFirst(
    await queryBuilder(tableName, opts)
      .insert(decamelize(fields))
      .returning("*")
  );
}

async function updateAndReturn(tableName, id, fields, opts) {
  return camelizeFirst(
    await queryBuilder(tableName, opts)
      .where({
        id
      })
      .update(decamelize(fields))
      .returning("*")
  );
}

const Table = {
  ASSIGNMENT: "assignment",
  BACKGROUND_JOB: "background_job",
  CAMPAIGN: "campaign",
  CAMPAIGN_CONTACT: "campaign_contact",
  CANNED_RESPONSE: "canned_response",
  INTERACTION_STEP: "interaction_step",
  JOB_REQUEST: "job_request",
  MESSAGE: "message",
  OPT_OUT: "opt_out",
  ORGANIZATION: "organization",
  QUESTION_RESPONSE: "question_response",
  TAG: "tag",
  TWILIO_PHONE_NUMBER: "twilio_phone_number",
  USER: "user",
  USER_ORGANIZATION: "user_organization",
  ZIP_CODE: "zip_code" // unused but will take some work to get rid of
};

export {
  queryBuilder,
  Table,
  knex,
  getAny,
  camelize,
  camelizeFirst,
  decamelize,
  transaction,
  withTransaction,
  insertAndReturn,
  updateAndReturn,
  convertCase
};
