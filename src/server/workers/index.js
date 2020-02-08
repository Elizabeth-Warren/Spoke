const AWS = require("aws-sdk");
import { assignTexters } from "./assign-texters";
import { uploadContacts } from "./upload-contacts";
import { exportCampaign } from "./export-campaign";
import log from "src/server/log";
import config, { JobExecutor } from "../config";

export const JobType = {
  ASSIGN_TEXTERS: "assign_texters",
  UPLOAD_CONTACTS: "upload_contacts",
  EXPORT_CAMPAIGN: "export"
};

export const WORKER_MAP = {
  [JobType.ASSIGN_TEXTERS]: assignTexters,
  [JobType.UPLOAD_CONTACTS]: uploadContacts,
  [JobType.EXPORT_CAMPAIGN]: exportCampaign
};

let lambdaClient;
function getLambdaClient() {
  if (!lambdaClient) {
    lambdaClient = new AWS.Lambda();
  }
  return lambdaClient;
}

async function invokeLambdaWorker(job) {
  try {
    const res = await getLambdaClient()
      .invoke({
        FunctionName: config.JOB_LAMBDA_WORKER_FUNCTION_NAME,
        InvocationType: "Event",
        Payload: JSON.stringify({ jobId: job.id })
      })
      .promise();
    log.debug({
      msg: "Lambda worker invocation response",
      response: res.response
    });
  } catch (e) {
    // TODO[matteo]: update job status to failed
    log.error({ msg: "Lambda worker invocation error", error: e });
  }
}

export async function dispatchJob(job) {
  log.debug({
    msg: "Dispatching Job",
    jobId: job.id,
    type: job.job_type,
    executor: config.JOB_EXECUTOR
  });
  const jobFn = WORKER_MAP[job.job_type];
  if (config.JOB_EXECUTOR === JobExecutor.IN_PROCESS) {
    await jobFn(job);
  } else if (config.JOB_EXECUTOR === JobExecutor.IN_PROCESS_ASYNC) {
    // missing await is intentional here
    jobFn(job);
  } else if (config.JOB_EXECUTOR === JobExecutor.LAMBDA) {
    await invokeLambdaWorker(job);
  } else {
    log.error(`Unknown job executor: ${config.JOB_EXECUTOR}`);
  }
}
