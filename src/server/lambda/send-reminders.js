import { sendReminderEmails } from "src/server/notifications";
import log from "src/server/log";
import telemetry from "src/server/telemetry";

async function handler(event) {
  log.debug({ msg: "Received event", event });

  log.info("Sending reminder emails...");

  try {
    await sendReminderEmails();
  } catch (e) {
    log.error({ msg: "Caught exception while sending reminders", err: e });
    await telemetry.reportError(e, { jobType: "sendReminders" });
    throw e;
  }

  log.info("All done.");
}

if (process.env.LAMBDA_INVOKE_IMMEDIATELY === "1") {
  handler()
    .catch(e => console.error(e))
    .then(() => process.exit());
}

module.exports.handler = handler;
