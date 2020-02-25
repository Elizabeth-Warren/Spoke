import { cacheableData, Campaign } from "src/server/models";
import { accessRequired, UserInputError } from "src/server/api/errors";
import twilio from "src/server/api/lib/twilio";
import db from "src/server/db";
import log from "src/server/log";
import { secureRandomString } from "src/server/crypto";

const PhoneStatus = db.TwilioPhoneNumber.Status;
const CampaignStatus = db.Campaign.Status;

async function prepareMessagingService(campaign) {
  // This has a pretty bad race if startCampaign gets called concurrently (e.g. from two
  // separate windows), but we are not going to fix it because it will be moved to a job,
  // where we'll implement the check differently
  if (campaign.messaging_service_sid) {
    log.warn(
      `Previous campaign creation failed, cleaning up messaging service ${campaign.messaging_service_sid}`
    );
    // This releases the numbers so they can be added to the new service we are creating
    await twilio.deleteMessagingService(campaign.messaging_service_sid);
  }

  const ts = Math.floor(new Date() / 1000);
  const friendlyName = `Campaign: ${campaign.organization_id}-${campaign.id}-${ts} [${process.env.BASE_URL}]`;
  const messagingService = await twilio.createMessagingService(friendlyName);
  const msgSrvSid = messagingService.sid;
  if (!msgSrvSid) {
    throw Error("Failed to create messaging service!");
  }

  // NOTE! until we move this to a background job we save the messaging service
  //  first so we can clean up if we retry
  campaign.messaging_service_sid = msgSrvSid;
  await campaign.save();

  await db.transaction(async transaction => {
    await db.TwilioPhoneNumber.assignToCampaign(campaign.id, { transaction });
    const listRes = await db.TwilioPhoneNumber.listCampaignNumbers(
      campaign.id,
      PhoneStatus.ASSIGNED,
      { transaction }
    );
    const phoneSids = listRes.map(r => r.sid);
    try {
      await twilio.addNumbersToMessagingService(phoneSids, msgSrvSid);
    } catch (e) {
      log.error({
        msg: "Failed add numbers to messaging service",
        campaign,
        mutation: "startCampaign",
        messagingServiceSid: msgSrvSid,
        error: e
      });
      campaign.messaging_service_sid = null;
      await Promise.all([
        campaign.save(),
        twilio.deleteMessagingService(msgSrvSid)
      ]);
      throw e; // abort transaction
    }
    log.info({
      msg: `Assigned ${phoneSids.length} numbers to campaign`,
      campaign,
      mutation: "startCampaign"
    });
  });
  return msgSrvSid;
}

export const mutations = {
  // TODO: startCampaign needs to become a job, this code will need to prevent duplicate jobs
  // TODO: pass request logger in context?
  startCampaign: async (_, { id }, { user, loaders }) => {
    const campaign = await Campaign.get(id);
    await accessRequired(user, campaign.organization_id, "ADMIN");
    if (campaign.is_started) {
      throw new UserInputError("Campaign already started!");
    }
    const organization = await loaders.organization.load(
      campaign.organization_id
    );
    const orgFeatures = JSON.parse(organization.features || "{}");

    let messagingServiceSid;
    if (orgFeatures.campaignPhoneNumbersEnabled) {
      log.info({
        msg: "Creating messaging service for campaign",
        campaign,
        mutation: "startCampaign"
      });
      messagingServiceSid = await prepareMessagingService(campaign);
    } else {
      log.info({
        msg: "Using default messaging service",
        campaign,
        mutation: "startCampaign"
      });
      messagingServiceSid =
        orgFeatures.messaging_service_sid ||
        process.env.TWILIO_MESSAGE_SERVICE_SID;
    }

    campaign.is_started = true;
    campaign.status = CampaignStatus.ACTIVE;
    campaign.started_at = new Date();
    campaign.messaging_service_sid = messagingServiceSid;
    if (campaign.use_dynamic_assignment) {
      campaign.join_token = secureRandomString(32);
    }
    await campaign.save();
    await cacheableData.campaign.reload(id);

    return campaign;
  },
  updateCampaignStatus: async (_, { id, status }, { user, loaders }) => {
    // TODO: add ARCHIVE here and remove unarchive
    const supportedStatuses = [
      CampaignStatus.ACTIVE,
      CampaignStatus.CLOSED,
      CampaignStatus.CLOSED_FOR_INITIAL_SENDS
    ];
    if (supportedStatuses.indexOf(status) === -1) {
      throw new UserInputError(`Setting status ${status} is not supported`);
    }
    const campaign = await loaders.campaign.load(id);
    await accessRequired(user, campaign.organization_id, "ADMIN");

    // you can only transition from any of the supported states to any of the others
    if (supportedStatuses.indexOf(campaign.status) === -1) {
      throw new UserInputError(
        `Cannot transition from ${campaign.status} to ${status}`
      );
    }

    // note: campaign gets passed to legacy resolver so we need to return snake case
    const updated = await db.Campaign.updateStatus(id, status, {
      snakeCase: true
    });
    await cacheableData.campaign.clear(id);
    return updated;
  }
};
