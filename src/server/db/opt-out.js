import config from "src/server/config";
import { queryBuilder, Table, knex } from "./common";

// TODO[matteo]: add get/list functions and replace thinky in the OptOut resolver
// TODO[matteo]: camel case keys and return values
async function create(
  { cell, organization_id, reason_code = undefined, assignment_id = undefined },
  opts
) {
  const res = await queryBuilder(Table.OPT_OUT, opts).insert({
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

  await queryBuilder(Table.CAMPAIGN_CONTACT, opts)
    .whereIn(
      "id",
      knex(Table.CAMPAIGN_CONTACT)
        .leftJoin(Table.CAMPAIGN, "campaign_contact.campaign_id", "campaign.id")
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
  const res = await queryBuilder(Table.OPT_OUT, opts)
    .select("id")
    .where(filters)
    .first();
  return !!res;
}

export default {
  create,
  isOptedOut
};
