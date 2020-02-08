import { r } from "../models";
import config from "../config";

const TABLE_NAME = "opt_out";

function queryBuilder(opts, tableName = TABLE_NAME) {
  const trx = opts && opts.transaction;
  return trx ? trx(tableName) : r.knex(tableName);
}

// TODO[matteo]: add get/list functions and replace thinky in the OptOut resolver

async function create(
  { cell, organization_id, reason_code = undefined, assignment_id = undefined },
  opts
) {
  const res = await queryBuilder(opts).insert({
    cell,
    assignment_id,
    organization_id,
    reason_code
  });

  let updateOpts;
  if (!config.OPTOUTS_SHARE_ALL_ORGS) {
    updateOpts = {
      "campaign_contact.cell": cell,
      "campaign.organization_id": organization_id,
      "campaign.is_archived": false
    };
  } else {
    updateOpts = {
      "campaign_contact.cell": cell,
      "campaign.is_archived": false
    };
  }

  await queryBuilder(opts, "campaign_contact")
    .whereIn(
      "id",
      r
        .knex("campaign_contact")
        .leftJoin("campaign", "campaign_contact.campaign_id", "campaign.id")
        .where(updateOpts)
        .select("campaign_contact.id")
    )
    .update({
      is_opted_out: true
    });
  return res;
}

async function isOptedOut({ cell, organization_id }, opts) {
  const filters = { cell };

  if (!config.OPTOUTS_SHARE_ALL_ORGS) {
    filters.organization_id = organization_id;
  }
  const res = await queryBuilder(opts)
    .select("id")
    .where(filters)
    .first();
  return !!res;
}

export default {
  create,
  isOptedOut
};
