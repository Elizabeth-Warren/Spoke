const AWS = require("aws-sdk");
import { assignTexters } from "./assign-texters";
import { uploadContacts } from "./upload-contacts";
import { exportCampaign } from "./export-campaign";
import { buyNumbers } from "./buy-numbers";
import log from "src/server/log";
import config, { JobExecutor } from "../config";
import db from "src/server/db";

export const JobType = {
  ASSIGN_TEXTERS: "assign_texters",
  UPLOAD_CONTACTS: "upload_contacts",
  EXPORT_CAMPAIGN: "export",
  BUY_NUMBERS: "buy_numbers"
};

function wrapJob(jobFn) {
  return async job => {
    try {
      await db.transaction(async transaction => {
        const j = await db.BackgroundJob.get(job.id, {
          transaction,
          forUpdate: true
        });
        if (j.status !== db.BackgroundJob.STATUS.PENDING) {
          throw Error(`Attempting to start a job with status ${j.status}`);
        }
        await db.BackgroundJob.updateStatus(
          job.id,
          {
            progress: 0,
            status: db.BackgroundJob.STATUS.RUNNING
          },
          { transaction }
        );
      });

      const resultMessage = await jobFn(job);

      await db.BackgroundJob.updateStatus(job.id, {
        progress: 1,
        status: db.BackgroundJob.STATUS.DONE,
        resultMessage: resultMessage || "Done"
      });
    } catch (e) {
      await db.BackgroundJob.updateStatus(job.id, {
        status: db.BackgroundJob.STATUS.FAILED,
        resultMessage: e.message
      });
      throw e;
    }
  };
}

export const WORKER_MAP = {
  [JobType.ASSIGN_TEXTERS]: wrapJob(assignTexters),
  [JobType.UPLOAD_CONTACTS]: wrapJob(uploadContacts),
  [JobType.EXPORT_CAMPAIGN]: wrapJob(exportCampaign),
  [JobType.BUY_NUMBERS]: wrapJob(buyNumbers)
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
    type: job.type,
    executor: config.JOB_EXECUTOR
  });
  const jobFn = WORKER_MAP[job.type];
  if (config.JOB_EXECUTOR === JobExecutor.IN_PROCESS) {
    await jobFn(job);
  } else if (config.JOB_EXECUTOR === JobExecutor.IN_PROCESS_ASYNC) {
    // missing await is intentional here
    jobFn(job);
  } else if (config.JOB_EXECUTOR === JobExecutor.LAMBDA) {
    try {
      await invokeLambdaWorker(job);
    } catch (e) {
      await db.BackgroundJob.updateStatus(job.id, {
        status: db.BackgroundJob.STATUS.FAILED,
        resultMessage: e.message
      });
      throw e;
    }
  } else {
    log.error(`Unknown job executor: ${config.JOB_EXECUTOR}`);
  }
}
