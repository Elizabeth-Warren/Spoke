import db from "src/server/db";
import log from "src/server/log";
import telemetry from "src/server/telemetry";
import { WORKER_MAP } from "src/server/workers";
import BackgroundJob from "src/server/db/background-job";

db.enableTracing();

exports.handler = async (event, context) => {
  log.debug({ msg: "Received event", event });
  if (!event.jobId) {
    log.error({ msg: "Missing jobId in event", event });
  }
  const job = await BackgroundJob.get(event.jobId);
  const workerFn = WORKER_MAP[job.type];
  if (!workerFn) {
    log.error({
      msg: "Could not find a worker for job",
      job,
      workers: Object.keys(WORKER_MAP)
    });
    return;
  }
  try {
    await workerFn(job);
  } catch (e) {
    // For now suppress Lambda retries by not raising the exception.
    // In the future, we may want to mark jobs as retryable and let Lambda do
    // its thing with exceptions.
    log.error({ msg: "Caught exception while processing job", job, err: e });
    await telemetry.reportError(e, { jobType: job.type });
  }
};
