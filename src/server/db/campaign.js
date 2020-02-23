import { Table, getAny, knex, queryBuilder, convertCase } from "./common";
import preconditions from "src/server/preconditions";

async function getByJoinToken(token, opts) {
  preconditions.check(token, "'token' must be provided");
  return getAny(Table.CAMPAIGN, "join_token", token, opts);
}

async function assignmentSummaries(campaignId, opts) {
  const counts = await queryBuilder(Table.CAMPAIGN_CONTACT, opts)
    .innerJoin(
      Table.ASSIGNMENT,
      "assignment.id",
      "campaign_contact.assignment_id"
    )
    .innerJoin(Table.USER, "assignment.user_id", "user.id")
    .select(
      "assignment.id as assignment_id",
      "user.id as texter_id",
      "user.first_name as texter_first_name",
      "user.first_name as texter_last_name",
      knex.raw(
        "count(message_status = 'needsMessage' OR NULL)::int as unmessaged_count"
      ),
      knex.raw(
        "count(message_status = 'needsResponse' OR NULL)::int as needs_response_count"
      ),
      knex.raw("count(message_status = 'convo' OR NULL)::int as convo_count"),
      knex.raw(
        "count(message_status IN ('closed') OR NULL)::int as closed_count"
      ),
      knex.raw("count(*)::int as contact_count")
    )
    .where("campaign_contact.campaign_id", campaignId)
    .groupBy([
      "assignment.id",
      "user.id",
      "texter_first_name",
      "texter_last_name"
    ]);
  return convertCase(counts, opts);
}

async function stats(campaignId, opts) {
  // todo
}

export default {
  assignmentSummaries,
  getByJoinToken,
  stats
};
