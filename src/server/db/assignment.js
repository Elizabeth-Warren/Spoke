import { Table, queryBuilder } from "./common";

async function isAssigned(userId, campaignId, opts) {
  const first = await queryBuilder(Table.ASSIGNMENT, opts)
    .where({ user_id: userId, campaign_id: campaignId })
    .first();

  return !!first;
}

export default {
  isAssigned
};
