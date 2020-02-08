import { r, JobRequest } from "../models";
import log from "src/server/log";

export const sleep = (ms = 0) => new Promise(fn => setTimeout(fn, ms));

export async function updateJob(job, percentComplete) {
  if (job.id) {
    await JobRequest.get(job.id).update({
      status: percentComplete,
      updated_at: new Date()
    });
  }
}

export const defensivelyDeleteJob = async job => {
  if (job.id) {
    let retries = 0;
    const deleteJob = async () => {
      try {
        await r
          .table("job_request")
          .get(job.id)
          .delete();
      } catch (err) {
        if (retries < 5) {
          retries += 1;
          await deleteJob();
        } else log.error(`Could not delete job. Err: ${err.message}`);
      }
    };

    await deleteJob();
  } else log.debug(job);
};
