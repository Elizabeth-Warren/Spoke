#!/usr/bin/env node
const parseArgs = require("minimist");
const twilio = require("twilio");
const urlJoin = require("url-join");

require("dotenv").config();

const COMMANDS = ["create", "update"];

async function main() {
  try {
    const { friendlyName, baseUrl, command, sid } = parseArgs(process.argv);

    if (!command || COMMANDS.indexOf(command) === -1) {
      console.log("Must a pass a valid --command: ", command);
      return;
    }

    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    const opts = { friendlyName };
    if (baseUrl) {
      if (baseUrl.includes("localhost")) {
        console.info(
          "baseUrl includes 'localhost', you probably don't want this. Check out ngrok!"
        );
        return;
      }

      opts.statusCallback = urlJoin(baseUrl, "/twilio-message-report");
      opts.inboundRequestUrl = urlJoin(baseUrl, "/twilio");
    } else {
      console.info("No base url provided, webhooks will not be configured");
    }

    if (command === "create") {
      const service = await client.messaging.services.create(opts);
      console.log("Successfully created service \n", service);
      console.log("\n Now go buy yourself a phone number or two!");
      console.log(
        `Link: https://www.twilio.com/console/sms/services/${service.sid}/numbers`
      );
      return;
    }

    if (!sid) {
      console.log("--sid is required for update commands");
      return;
    }
    const service = await client.messaging.services(sid).update(opts);
    console.log("Successfully updated service \n", service);
  } catch (e) {
    console.error(e);
  } finally {
    process.exit();
  }
}

main();
