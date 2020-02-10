import { r, Assignment, Campaign, User, Organization } from "./models";
import log from "src/server/log";
import { sendEmail, sendTemplatedEmail } from "./mail";

export const Notifications = {
  CAMPAIGN_STARTED: "campaign.started",
  ASSIGNMENT_MESSAGE_RECEIVED: "assignment.message.received",
  ASSIGNMENT_CREATED: "assignment.created",
  ASSIGNMENT_UPDATED: "assignment.updated"
};

const SES_TEMPLATE_NAMES = {
  [Notifications.ASSIGNMENT_MESSAGE_RECEIVED]:
    "spoke_assignment_message_received",
  [Notifications.ASSIGNMENT_CREATED]: "spoke_assignment_created",
  [Notifications.ASSIGNMENT_UPDATED]: "spoke_assignment_updated"
};

async function getOrganizationOwner(organizationId) {
  return await r
    .table("user_organization")
    .getAll(organizationId, { index: "organization_id" })
    .filter({ role: "OWNER" })
    .limit(1)
    .eqJoin(
      "user_id",
      r.table("user")
    )("right")(0);
}

const sendAssignmentUserNotification = async (assignment, type) => {
  const campaign = await Campaign.get(assignment.campaign_id);

  if (!campaign.is_started) {
    return;
  }

  if (
    type !== Notifications.ASSIGNMENT_UPDATED &&
    type !== Notifications.ASSIGNMENT_CREATED
  ) {
    log.error(
      "Incorrect notification type passed to sendAssignmentUserNotification",
      type
    );
    return;
  }

  const organization = await Organization.get(campaign.organization_id);
  const user = await User.get(assignment.user_id);
  const orgOwner = await getOrganizationOwner(organization.id);

  try {
    await sendTemplatedEmail({
      to: user.email,
      template: SES_TEMPLATE_NAMES[type],
      templateData: {
        first_name: user.first_name,
        campaign_title: campaign.title,
        organization_name: organization.name,
        texter_link: `${process.env.BASE_URL}/app/${campaign.organization_id}/todos`
      }
    });
  } catch (e) {
    log.error(e);
  }
};

// TODO: DRY this up
export const sendUserNotification = async notification => {
  log.debug("Sending notification: ", notification);
  const { type } = notification;

  if (type === Notifications.CAMPAIGN_STARTED) {
    const assignments = await r
      .table("assignment")
      .getAll(notification.campaignId, { index: "campaign_id" })
      .pluck(["user_id", "campaign_id"]);

    const count = assignments.length;
    for (let i = 0; i < count; i++) {
      const assignment = assignments[i];
      await sendAssignmentUserNotification(
        assignment,
        Notifications.ASSIGNMENT_CREATED
      );
    }
  } else if (type === Notifications.ASSIGNMENT_MESSAGE_RECEIVED) {
    const assignment = await Assignment.get(notification.assignmentId);
    const campaign = await Campaign.get(assignment.campaign_id);
    const campaignContact = await r
      .table("campaign_contact")
      .getAll(notification.contactNumber, { index: "cell" })
      .filter({ campaign_id: campaign.id })
      .limit(1)(0);

    if (!campaignContact.is_opted_out) {
      const user = await User.get(assignment.user_id);
      const organization = await Organization.get(campaign.organization_id);
      const orgOwner = await getOrganizationOwner(organization.id);

      try {
        await sendTemplatedEmail({
          to: user.email,
          template: SES_TEMPLATE_NAMES[type],
          templateData: {
            first_name: user.first_name,
            campaign_title: campaign.title,
            organization_name: organization.name,
            texter_link: `${process.env.BASE_URL}/app/${campaign.organization_id}/todos`
          },
          subject: `[${organization.name}] [${campaign.title}] New reply`,
          text: `Someone responded to your message. See all your replies here: \n\n${process.env.BASE_URL}/app/${campaign.organization_id}/todos/${notification.assignmentId}/reply`
        });
      } catch (e) {
        log.error(e);
      }
    }
  } else if (type === Notifications.ASSIGNMENT_CREATED) {
    const { assignment } = notification;
    await sendAssignmentUserNotification(assignment, type);
  }
};

const setupIncomingReplyNotification = () =>
  r
    .table("message")
    .changes()
    .then(function(message) {
      if (!message.old_val && message.new_val.is_from_contact) {
        sendUserNotification({
          type: Notifications.ASSIGNMENT_MESSAGE_RECEIVED,
          assignmentId: message.new_val.assignment_id,
          contactNumber: message.new_val.contact_number
        });
      }
    });

const setupNewAssignmentNotification = () =>
  r
    .table("assignment")
    .changes()
    .then(function(assignment) {
      if (!assignment.old_val) {
        sendUserNotification({
          type: Notifications.ASSIGNMENT_CREATED,
          assignment: assignment.new_val
        });
      }
    });

let notificationObserversSetup = false;

export const setupUserNotificationObservers = () => {
  if (!notificationObserversSetup) {
    notificationObserversSetup = true;
    setupIncomingReplyNotification();
    setupNewAssignmentNotification();
  }
};
