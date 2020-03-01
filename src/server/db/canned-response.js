import {
  Table,
  convertCase,
  queryBuilder,
  withTransaction,
  decamelize,
  insertAndReturn,
  updateAndReturn,
  knex,
  camelize
} from "./common";

async function create(
  { title, text, surveyQuestion, campaignId, userId, order },
  opts
) {
  return insertAndReturn(
    Table.CANNED_RESPONSE,
    {
      title,
      text,
      surveyQuestion,
      campaignId,
      userId,
      order
    },
    opts
  );
}

async function createMany(cannedResponses, opts) {
  const returning = opts.returning || "id";
  return queryBuilder(Table.CANNED_RESPONSE, opts)
    .insert(decamelize(cannedResponses))
    .returning(returning);
}

async function update(
  id,
  { title, text, surveyQuestion, userId, deleted, order },
  opts
) {
  return updateAndReturn(
    Table.CANNED_RESPONSE,
    id,
    {
      title,
      text,
      surveyQuestion,
      userId,
      deleted,
      order
    },
    opts
  );
}

/**
 * Label many canned responses simultaneously.
 * rows is a list of { id, labelId } rows
 */
async function bulkAddLabels(rows, opts = {}) {
  return withTransaction(opts, async newOpts => {
    const insertedIds = await knex
      .batchInsert(
        Table.CANNED_RESPONSE_LABEL,
        rows.map(r => ({ canned_response_id: r.id, label_id: r.labelId })),
        opts.chunkSize || 1000
      )
      .returning("id")
      .transacting(newOpts.transaction);

    // Check that all labels and canned responses belong to the same org
    const mismatch = await queryBuilder(Table.CANNED_RESPONSE_LABEL, newOpts)
      .innerJoin(Table.LABEL, "canned_response_label.label_id", "label.id")
      .innerJoin(
        Table.CANNED_RESPONSE,
        "canned_response_label.canned_response_id",
        "canned_response.id"
      )
      .innerJoin(Table.CAMPAIGN, "canned_response.campaign_id", "campaign.id")
      .whereIn("canned_response_label.id", insertedIds)
      .whereRaw("label.organization_id != campaign.organization_id")
      .count("*")
      .first();

    if (mismatch.count !== "0") {
      throw new Error(
        "Integrity error: canned responses and labels don't have the same org id"
      );
    }
    return insertedIds;
  });
}

/**
 * Bulk update ordering of canned responses
 *
 * Rows is a list of { id, labelId } objects
 */
async function bulkUpdateOrder(rows, opts = {}) {
  const placeholders = rows.map(_ => "(?::integer , ?::integer)").join();
  let query = knex.raw(
    `UPDATE canned_response
     SET "order" = updates."order"
     FROM (VALUES ${placeholders}) as updates (id, "order")
     WHERE updates.id = canned_response.id`,
    rows.flatMap(r => [parseInt(r.id, 10), r.order])
  );
  if (opts.transaction) {
    query = query.transacting(opts.transaction);
  }
  return query;
}

async function hardDeleteLabels(cannedResponseId, opts) {
  return queryBuilder(Table.CANNED_RESPONSE_LABEL, opts)
    .delete()
    .where("canned_response_id", cannedResponseId);
}

async function updateLabels(cannedResponseId, labelIds, opts) {
  return withTransaction(opts, async newOpts => {
    await hardDeleteLabels(cannedResponseId, newOpts);
    await bulkAddLabels(
      labelIds.map(labelId => ({ labelId, id: cannedResponseId })),
      newOpts
    );
  });
}

async function listLabels(cannedResponseId, opts) {
  return convertCase(
    await queryBuilder(Table.CANNED_RESPONSE_LABEL, opts)
      .innerJoin(Table.LABEL, "canned_response_label.label_id", "label.id")
      .where("canned_response_id", cannedResponseId)
      .select("label.*"),
    opts
  );
}

export default {
  create,
  createMany,
  update,
  updateLabels,
  bulkAddLabels,
  listLabels,
  bulkUpdateOrder
};
