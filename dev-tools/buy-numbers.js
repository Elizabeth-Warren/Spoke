#!/usr/bin/env node
const parseArgs = require("minimist");
const twilio = require("twilio");
require("dotenv").config();

// maximum when listing available numbers
const MAX_PAGE_SIZE = 30;

const {
  areaCode,
  limit,
  friendlyNamePrefix,
  voiceUrl,
  smsUrl,
  messagingServiceSid,
  // TODO: add an option to request specific capabilities
  addToSpokeInventory // TODO: implement this once Spoke tables are created
} = parseArgs(process.argv, { default: { limit: 1 } });

// TODO: more validation
if (typeof areaCode !== "number" || areaCode > 999) {
  console.error(`Invalid area code: ${areaCode}`);
  process.exit();
}

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

let successCount = 0;

async function buy(max) {
  console.log("Attempting to buy: ", max);
  const nums = await client
    .availablePhoneNumbers("US")
    .local.list({
      areaCode,
      limit: max,
      pageSize: MAX_PAGE_SIZE,
      capabilities: ["SMS"]
    });

  for (const num of nums) {
    console.log(`Buying Number: ${num.phoneNumber}`);
    const opts = { phoneNumber: num.phoneNumber, voiceUrl, smsUrl };
    if (friendlyNamePrefix) {
      opts.friendlyName = `${friendlyNamePrefix} ${num.phoneNumber}`;
    }
    const result = await client.incomingPhoneNumbers.create(opts);
    if (messagingServiceSid) {
      console.log(
        `Associating ${result.sid} with service ${messagingServiceSid}`
      );
      await client.messaging
        .services(messagingServiceSid)
        .phoneNumbers.create({ phoneNumberSid: result.sid });
    }
    successCount++;
  }
  return nums.length;
}

async function main() {
  try {
    while (successCount < limit) {
      const nextBatch = Math.min(MAX_PAGE_SIZE, limit - successCount);
      const found = await buy(nextBatch);
      if (found === 0) {
        console.log("Didn't find any numbers :(");
        break;
      }
    }
  } catch (e) {
    console.error(e);
  }
  if (messagingServiceSid) {
    console.log(
      `Link to your messaging service: https://www.twilio.com/console/sms/services/${messagingServiceSid}/numbers`
    );
  }
  // Log the number we bought successfully if we fail part way through
  console.log(`Bought ${successCount} number(s)`);
}

main().then(() => process.exit());
