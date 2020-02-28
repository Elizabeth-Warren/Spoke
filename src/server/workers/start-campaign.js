import { secureRandomString } from "src/server/crypto";
import db from "src/server/db";
import log from "src/server/log";
import { Organization, Campaign } from "src/server/models";
import twilio from "src/server/api/lib/twilio";
import { cacheableData } from "src/server/models/cacheable_queries";

const PhoneStatus = db.TwilioPhoneNumber.Status;
const CampaignStatus = db.Campaign.Status;

async function prepareMessagingService(campaign) {
  const ts = Math.floor(new Date() / 1000);
  const friendlyName = `Campaign ${campaign.id}: ${campaign.organization_id}-${ts} [${process.env.BASE_URL}]`;
  const messagingService = await twilio.createMessagingService(friendlyName);
  const msgSrvSid = messagingService.sid;
  if (!msgSrvSid) {
    throw Error("Failed to create messaging service!");
  }
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
      log.info({
        msg: `Assigned ${phoneSids.length} numbers to campaign`,
        campaignId: campaign.id
      });
    } catch (e) {
      log.error({
        msg: "Failed add numbers to messaging service",
        campaign,
        worker: "start_campaign",
        messagingServiceSid: msgSrvSid,
        error: e
      });
      await twilio.deleteMessagingService(msgSrvSid);
      throw e;
    }
  });

  return msgSrvSid;
}

export async function startCampaign(job) {
  const payload = JSON.parse(job.config);
  const campaignId = payload.campaignId;
  if (!campaignId) {
    throw new Error("Missing campaign id");
  }

  const campaign = await Campaign.get(campaignId);
  if (campaign.is_started) {
    throw new Error("Campaign already started!");
  }
  const organization = await Organization.get(campaign.organization_id);
  const orgFeatures = JSON.parse(organization.features || "{}");
  await new Promise(resolve => setTimeout(resolve, 10000));
  let messagingServiceSid;
  if (orgFeatures.campaignPhoneNumbersEnabled) {
    log.info({
      msg: "Creating messaging service for campaign",
      campaignId
    });
    messagingServiceSid = await prepareMessagingService(campaign);
  } else {
    log.info({
      msg: "Using default messaging service",
      campaignId
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
  await cacheableData.campaign.clear(campaignId);
}
