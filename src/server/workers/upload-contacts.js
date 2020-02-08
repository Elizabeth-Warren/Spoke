import {
  r,
  cacheableData,
  Campaign,
  CampaignContact,
  Organization
} from "../models";
import { gunzip } from "../../lib";
import { sleep, updateJob } from "./lib";
import log from "src/server/log";

function optOutsByOrgId(orgId) {
  return r.knex
    .select("cell")
    .from("opt_out")
    .where("organization_id", orgId);
}

function optOutsByInstance() {
  return r.knex.select("cell").from("opt_out");
}

function getOptOutSubQuery(orgId) {
  return !!process.env.OPTOUTS_SHARE_ALL_ORGS
    ? optOutsByInstance()
    : optOutsByOrgId(orgId);
}

const unzipPayload = async job =>
  JSON.parse(await gunzip(Buffer.from(job.payload, "base64")));

// Note: Unlike some other forks, the Warren fork does not support using
// contact zip to enforce texting hours.
export async function uploadContacts(job) {
  const campaignId = job.campaign_id;
  // We do this deletion in schema.js but we do it again here just in case the the queue broke and we had a backlog of contact uploads for one campaign
  const campaign = await Campaign.get(campaignId);
  const organization = await Organization.get(campaign.organization_id);
  const orgFeatures = JSON.parse(organization.features || "{}");

  const jobMessages = [];

  await r
    .table("campaign_contact")
    .getAll(campaignId, { index: "campaign_id" })
    .delete();
  const maxPercentage = 100;

  let contacts = await unzipPayload(job);
  const chunkSize = 1000;

  const maxContacts = parseInt(
    orgFeatures.hasOwnProperty("maxContacts")
      ? orgFeatures.maxContacts
      : process.env.MAX_CONTACTS || 0,
    10
  );

  if (maxContacts) {
    // note: maxContacts == 0 means no maximum
    contacts = contacts.slice(0, maxContacts);
  }

  const numChunks = Math.ceil(contacts.length / chunkSize);

  for (let index = 0; index < numChunks; index++) {
    await updateJob(job, Math.round((maxPercentage / numChunks) * index));
    const savePortion = contacts.slice(
      index * chunkSize,
      (index + 1) * chunkSize
    );
    await CampaignContact.save(savePortion);
    log.info(
      `Campaign ${campaignId}: processed ${(index + 1) * chunkSize} of ${
        contacts.length
      } contacts`
    );
  }

  const optOutCellCount = await r
    .knex("campaign_contact")
    .whereIn("cell", function optouts() {
      this.select("cell")
        .from("opt_out")
        .where("organization_id", campaign.organization_id);
    });

  const deleteOptOutCells = await r
    .knex("campaign_contact")
    .whereIn("cell", getOptOutSubQuery(campaign.organization_id))
    .where("campaign_id", campaignId)
    .delete()
    .then(result => {
      log.info("deleted result: " + result);
    });

  if (deleteOptOutCells) {
    jobMessages.push(
      `Number of contacts excluded due to their opt-out status: ${optOutCellCount}`
    );
  }

  if (job.id) {
    if (jobMessages.length) {
      await r
        .knex("job_request")
        .where("id", job.id)
        .update({ result_message: jobMessages.join("\n") });
    } else {
      await r
        .table("job_request")
        .get(job.id)
        .delete();
    }
  }
  await cacheableData.campaign.reload(campaignId);
}
