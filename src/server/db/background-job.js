import {
  Table,
  getAny,
  camelize,
  insertAndReturn,
  updateAndReturn,
  queryBuilder
} from "./common";

export const STATUS = {
  PENDING: "PENDING",
  RUNNING: "RUNNING",
  FAILED: "FAILED",
  DONE: "DONE"
};

async function create(
  { campaignId, organizationId, userId, type, config },
  opts
) {
  return await insertAndReturn(
    Table.BACKGROUND_JOB,
    {
      campaignId,
      organizationId,
      userId,
      type,
      config
    },
    opts
  );
}

async function updateStatus(jobId, { progress, status, resultMessage }, opts) {
  return await updateAndReturn(
    Table.BACKGROUND_JOB,
    jobId,
    {
      progress,
      status,
      resultMessage
    },
    opts
  );
}

async function get(jobId, opts) {
  return getAny(Table.BACKGROUND_JOB, "id", jobId, opts);
}

async function getByTypeAndCampaign(type, campaignId, opts) {
  return camelize(
    await queryBuilder(Table.BACKGROUND_JOB, opts)
      .where({
        campaign_id: campaignId,
        type
      })
      .orderBy("created_at", "desc")
      .first()
  );
}

const BackgroundJob = {
  create,
  updateStatus,
  get,
  getByTypeAndCampaign,
  STATUS
};
export default BackgroundJob;
