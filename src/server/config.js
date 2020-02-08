function optionalInt(stringVal, defaultVal = undefined) {
  return stringVal ? parseInt(stringVal, 10) : defaultVal;
}

export const JobExecutor = {
  LAMBDA: "LAMBDA",
  IN_PROCESS: "IN_PROCESS",
  IN_PROCESS_ASYNC: "IN_PROCESS_ASYNC"
};

const lambdaWorkerFunction = process.env.JOB_LAMBDA_WORKER_FUNCTION_NAME;

function getJobExecutor() {
  const envVar = process.env.JOB_EXECUTOR || global.JOB_EXECUTOR;
  if (envVar) {
    const executor = JobExecutor[envVar.toUpperCase()];
    if (!executor) {
      throw Error(
        `Improperly configured: JOB_EXECUTOR must be one of ${Object.keys(
          JobExecutor
        )}`
      );
    }
    if (executor === JobExecutor.LAMBDA && !lambdaWorkerFunction) {
      throw Error(
        "Improperly configured: missing JOB_LAMBDA_WORKER_FUNCTION_NAME"
      );
    }
    return executor;
  }

  // preserve backwards compatibility with old env vars if the new one isn't set
  const sameProc = !!(
    process.env.JOBS_SAME_PROCESS || global.JOBS_SAME_PROCESS
  );
  const sync = !!(process.env.JOBS_SYNC || global.JOBS_SYNC);
  if (sync && sameProc) {
    return JobExecutor.IN_PROCESS;
  } else if (sameProc) {
    return JobExecutor.IN_PROCESS_ASYNC;
  } else {
    throw Error("Improperly configured: missing JOB_EXECUTOR");
  }
}

export default {
  DEFAULT_CACHE_TTL: optionalInt(process.env.DEFAULT_CACHE_TTL, 3600), // 1 hour
  CACHE_PREFIX: process.env.CACHE_PREFIX || "",
  OPTOUTS_SHARE_ALL_ORGS: !!process.env.OPTOUTS_SHARE_ALL_ORGS,
  LOG_LEVEL: process.env.LOG_LEVEL || "info",
  SES_CONFIGURATION_SET_NAME:
    process.env.SES_CONFIGURATION_SET_NAME || "organizing_emails",
  JOB_EXECUTOR: getJobExecutor(),
  JOB_LAMBDA_WORKER_FUNCTION_NAME: lambdaWorkerFunction
};
