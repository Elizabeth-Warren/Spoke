import { cacheableData } from "src/server/models";
import { accessRequired } from "src/server/api/errors";
import { Notifications, sendUserNotification } from "src/server/notifications";
import twilio from "src/server/api/lib/twilio";
import db from "src/server/db";
import log from "src/server/log";
import { secureRandomString } from "src/server/crypto";

const Status = db.TwilioPhoneNumber.Status;

async function prepareMessagingService(campaign) {
  const ts = Math.floor(new Date() / 1000);
  const friendlyName = `Campaign: ${campaign.organization_id}-${campaign.id}-${ts} [${process.env.BASE_URL}]`;
  const messagingService = await twilio.createMessagingService(friendlyName);
  const msgSrvSid = messagingService.sid;
  if (!msgSrvSid) {
    throw Error("Failed to create messaging service!");
  }

  await db.transaction(async transaction => {
    await db.TwilioPhoneNumber.assignToCampaign(campaign.id, { transaction });
    const listRes = await db.TwilioPhoneNumber.listCampaignNumbers(
      campaign.id,
      Status.ASSIGNED,
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
      await twilio.removeNumbersFromMessagingService(phoneSids, msgSrvSid);
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
  // TODO: startCampaign might need to become a job
  // TODO: pass request logger in context?
  startCampaign: async (_, { id }, { user, loaders }) => {
    const campaign = await loaders.campaign.load(id);
    await accessRequired(user, campaign.organization_id, "ADMIN");
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
    campaign.messaging_service_sid = messagingServiceSid;
    if (campaign.use_dynamic_assignment) {
      campaign.join_token = secureRandomString(32);
    }
    await campaign.save();
    await cacheableData.campaign.reload(id);
    try {
      // TODO: dispatch a job to send notifications!
      await sendUserNotification({
        type: Notifications.CAMPAIGN_STARTED,
        campaignId: id
      });
    } catch (e) {
      log.warn({
        msg: "Failed to campaign start notifications",
        campaign,
        mutation: "startCampaign"
      });
    }
    return campaign;
  }
};
