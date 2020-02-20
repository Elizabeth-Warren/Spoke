import log from "src/server/log";
import twilio from "src/server/api/lib/twilio";
import preconditions from "src/server/preconditions";
import telemetry from "src/server/telemetry";
import BackgroundJob from "src/server/db/background-job";

const MAX_NUMBERS_PER_JOB = 500;

async function buyBatch(areaCode, limit) {
  let successCount = 0;
  log.debug(`Attempting to buy batch of ${limit} numbers`);
  const response = await twilio.searchForAvailableNumbers(areaCode, limit);
  for (const item of response) {
    await twilio.buyNumber(item.phoneNumber);
    successCount++;
  }
  log.debug(`Successfully bought ${successCount} number(s)`);
  return successCount;
}

export async function buyNumbers(job) {
  const payload = JSON.parse(job.config);
  const { areaCode, limit } = preconditions.checkMany({
    areaCode: payload.areaCode,
    limit: payload.limit
  });
  const totalRequested = Math.min(limit, MAX_NUMBERS_PER_JOB);
  let totalPurchased = 0;
  await telemetry.reportEvent("Buy Numbers Job", {
    status: "STARTING",
    "Area Code": areaCode,
    "Total Requested": totalRequested,
    "Requested By": job.userId
  });
  while (totalPurchased < totalRequested) {
    const nextBatch = Math.min(30, totalRequested - totalPurchased);
    const purchasedInBatch = await buyBatch(areaCode, nextBatch);
    totalPurchased += purchasedInBatch;
    await BackgroundJob.updateStatus(job.id, {
      status: BackgroundJob.STATUS.RUNNING,
      progress: totalPurchased / purchasedInBatch
    });
    if (purchasedInBatch === 0) {
      break;
    }
  }
  log.info(`Bought ${totalPurchased} number(s)`);
  await telemetry.reportEvent("Buy Numbers Job", {
    status: "COMPLETE",
    "Area Code": areaCode,
    "Total Requested": totalRequested,
    "Requested By": job.userId
  });
}
