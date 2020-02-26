import { knex, bulkInsert as bulkInsertUtil } from "./common";

async function getPendingReplyNotifications() {
  const result = await knex.raw(`
    SELECT
      "user".id AS user_id,
      "user".first_name AS user_first_name,
      "user".email AS email,
      organization.id AS organization_id,
      organization.name AS organization_name,
      ARRAY_AGG(assignment.id) AS assignment_ids
    FROM assignment
      JOIN "user" ON assignment.user_id = "user".id
      JOIN campaign ON assignment.campaign_id = campaign.id
      JOIN organization ON campaign.organization_id = organization.id
    WHERE EXISTS (
      -- only assignments where there's a pending reply
      SELECT 1
      FROM campaign_contact
      LEFT JOIN opt_out ON campaign_contact.cell = opt_out.cell
      WHERE
        -- ignore opted-out contacts
        is_opted_out IS NOT TRUE
        AND opt_out.id IS NULL
        AND campaign_contact.assignment_id = assignment.id
        -- only messages that need a reply
        AND campaign_contact.message_status = 'needsResponse'
        -- only contacts from the past 2 days
        AND campaign_contact.updated_at > (NOW() - '2 days'::interval)
    )
    AND NOT EXISTS (
      -- exclude active users -- any user that has texted in the past 15 minutes
      SELECT 1
      FROM message
      WHERE user_id = "user".id
      AND message.created_at > (NOW() - '15 minutes'::interval)
      AND message.is_from_contact IS FALSE
    )
    AND NOT EXISTS (
      SELECT 1
      FROM notification
      WHERE email = "user".email
      AND created_at > (NOW() - '4 hours'::interval)
    )
    -- only active campaigns
    AND campaign.is_archived IS NOT TRUE
    AND campaign.is_started IS TRUE
    AND (campaign.status IS NULL OR (campaign.status NOT IN ('CLOSED', 'ARCHIVED', 'NOT_STARTED')))
    -- not unsubscribed users
    AND "user".subscribed_to_reminders IS TRUE
    -- group by user/org
    GROUP BY 1, 2, 3, 4, 5
  `);

  return result.rows;
}

async function bulkInsert(notifications, opts = {}) {
  return bulkInsertUtil("notification", notifications, opts);
}

export default {
  getPendingReplyNotifications,
  bulkInsert
};
