import { r, Campaign, Organization } from "src/server/models";
import { cacheableData } from "src/server/models/cacheable_queries";
import log from "src/server/log";
import s3 from "src/server/s3";
import BackgroundJob from "src/server/db/background-job";
import humps from "humps";

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

async function fetchContacts(payloadJSON) {
  const { s3Key } = JSON.parse(payloadJSON);

  const contactsJSON = await s3
    .getObject({
      Key: s3Key
    })
    .promise();

  return JSON.parse(contactsJSON.Body.toString());
}

// Note: Unlike some other forks, the Warren fork does not support using
// contact zip to enforce texting hours.
export async function uploadContacts(job) {
  const campaignId = job.campaignId;
  // We do this deletion in schema.js but we do it again here just in case the the queue broke and we had a backlog of contact uploads for one campaign
  const campaign = await Campaign.get(campaignId);
  const organization = await Organization.get(campaign.organization_id);
  const orgFeatures = JSON.parse(organization.features || "{}");

  const jobMessages = [];

  await r
    .table("campaign_contact")
    .getAll(campaignId, { index: "campaign_id" })
    .delete();

  let contacts = await fetchContacts(job.config);
  contacts.forEach(c => {
    c.campaign_id = campaignId;
  });

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
    await BackgroundJob.updateStatus(job.id, {
      status: BackgroundJob.STATUS.RUNNING,
      progress: index / numChunks
    });

    const savePortion = contacts
      .slice(index * chunkSize, (index + 1) * chunkSize)
      .map(c => humps.decamelizeKeys(c, { separator: "_" }));

    await r.knex("campaign_contact").insert(savePortion);

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

  await cacheableData.campaign.reload(campaignId);

  return jobMessages.join("\n");
}
