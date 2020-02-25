#!/usr/bin/env node
const twilio = require("twilio");

async function main() {
  try {
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    let page = await client.incomingPhoneNumbers.page({ pageSize: 100 });

    while (page) {
      for (const i of page.instances) {
        console.log(JSON.stringify(i));
      }
      page = await page.nextPage();
    }
  } catch (e) {
    console.error(e);
  }
}

main().then(() => process.exit());
