#!/usr/bin/env node
const parseArgs = require("minimist");
const twilio = require("twilio");
require("dotenv").config();

async function main() {
  let successCount = 0;
  try {
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    // TODO: validation
    const {
      areaCode,
      limit,
      friendlyNamePrefix,
      voiceUrl,
      smsUrl,
      addToSpokeInventory // TODO: implement this once Spoke tables are created
    } = parseArgs(process.argv, { default: { limit: 1 } });

    if (typeof areaCode !== "number" || areaCode > 999) {
      console.error(`Invalid area code: ${areaCode}`);
      return;
    }

    // Note: will only fetch one page of results, but you don't actually want to
    // buy more than a 1000 numbers at a time, right?
    const nums = await client
      .availablePhoneNumbers("US")
      .local
      .list({
        areaCode,
        limit,
        pageSize: 1000,
        capabilities: ["SMS", "voice"]
      });

    if (nums.length === 0) {
      console.log("Didn't find any numbers");
      return;
    }

    for (const num of nums) {
      console.log(`Buying Number: ${num.phoneNumber}`);
      const opts = { phoneNumber: num.phoneNumber, voiceUrl, smsUrl };
      if (friendlyNamePrefix) {
        opts.friendlyName = `${friendlyNamePrefix} ${num.phoneNumber}`;
      }
      await client.incomingPhoneNumbers.create(opts);
      successCount++;
    }
  } catch (e) {
    console.error(e);
  }
  // Log the number we bought successfully if we fail part way through
  console.log(`Bought ${successCount} number(s)`);
}

main().then(() => process.exit());
