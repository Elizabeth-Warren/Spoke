import Twilio from "twilio";
import { getFormattedPhoneNumber } from "../../../lib/phone-format";
import { Message, Campaign, r } from "../../models";
import log from "src/server/log";
import { getLastMessage, saveNewIncomingMessage } from "./message-sending";
import urlJoin from "url-join";
import _ from "lodash";
import preconditions from "src/server/preconditions";
import crypto from "crypto";
import randomSecret from "src/server/random-secret";
import url from "url";

let twilio = null;
const MAX_SEND_ATTEMPTS = 5;
const MESSAGE_VALIDITY_PADDING_SECONDS = 30;
const MAX_TWILIO_MESSAGE_VALIDITY = 14400;
const MAX_NUMBERS_PER_MESSAGING_SERVICE = 400;
const BULK_REQUEST_CONCURRENCY = 10;

const baseCallbackUrl =
  process.env.TWILIO_BASE_CALLBACK_URL || process.env.BASE_URL;

if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  // eslint-disable-next-line new-cap
  twilio = Twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
} else {
  log.warn("NO TWILIO CONNECTION");
}

if (!process.env.TWILIO_MESSAGE_SERVICE_SID) {
  log.warn(
    "Twilio will not be able to send without TWILIO_MESSAGE_SERVICE_SID set"
  );
}

function webhook() {
  if (twilio) {
    return Twilio.webhook({
      host: url.parse(process.env.BASE_URL).host
    });
  }

  log.warn("NO TWILIO WEB VALIDATION");
  return function noopTwilioWebhookValidator(req, res, next) {
    next();
  };
}

function shouldDropMessage(origTo) {
  if (process.env.DROP_MESSAGE_RATIO) {
    const ratio = Number(process.env.DROP_MESSAGE_RATIO);
    if (Number.isNaN(ratio)) {
      log.error(
        `Invalid DROP_MESSAGE_RATIO: ${process.env.DROP_MESSAGE_RATIO} -- must be a number. All messages will be dropped`
      );
      return true;
    }

    if (ratio < 0 || ratio > 1) {
      log.error(
        `Invalid DROP_MESSAGE_RATIO: ${process.env.DROP_MESSAGE_RATIO} -- must be between 0 and 1. All messages will be dropped`
      );
      return true;
    }

    // rather than randomly dropping, we base it on a hash of the phone number. That way,
    // we get roughly the correct response ratio but the simulated responders keep
    // responding consistently
    const hash = crypto.createHash("sha256");
    hash.update(origTo);
    const hexDigest = hash.digest("hex");

    const hashInt = parseInt(hexDigest.slice(0, 8), 16);
    const normalizedValue = hashInt / 16 ** 8;

    if (normalizedValue < ratio) {
      log.info(
        `Dropping message to ${origTo} (hash value: ${normalizedValue.toFixed(
          4
        )}) due to DROP_MESSAGE_RATIO of ${ratio}`
      );
      return true;
    }
  }

  return false;
}

async function messagingServiceForContact(contact) {
  // TODO[matteo]: cache this
  const campaign = await Campaign.get(contact.campaign_id);
  return preconditions.check(
    campaign.messaging_service_sid,
    `Unable to find messaging service for campaign ${contact.campaign_id}`
  );
}

async function sendMessage(message, contact, trx) {
  if (!twilio) {
    log.warn(
      "cannot actually send SMS message -- twilio is not fully configured:",
      message.id
    );
    if (message.id) {
      const options = trx ? { transaction: trx } : {};
      await Message.get(message.id).update(
        { send_status: "SENT", sent_at: new Date() },
        options
      );
    }
    return "test_message_uuid";
  }

  // Construct the outgoing message
  const messagingServiceSid = await messagingServiceForContact(contact);

  if (message.service !== "twilio") {
    log.warn("Message not marked as a twilio message", message.id);
  }

  const messageParams = {
    to: message.contact_number,
    body: message.text,
    messagingServiceSid
  };

  // Allow us to set OVERRIDE_RECIPIENT to send all texts to a single number for
  // development.
  if (process.env.OVERRIDE_RECIPIENT) {
    messageParams.body = `[${messageParams.to}] ${messageParams.body}`;
    messageParams.to = process.env.OVERRIDE_RECIPIENT;
  }

  let twilioValidityPeriod = process.env.TWILIO_MESSAGE_VALIDITY_PERIOD;

  if (message.send_before) {
    // the message is valid no longer than the time between now and
    // the send_before time, less 30 seconds
    // we subtract the MESSAGE_VALIDITY_PADDING_SECONDS seconds to allow time for the message to be sent by
    // a downstream service
    const messageValidityPeriod =
      Math.ceil((message.send_before - Date.now()) / 1000) -
      MESSAGE_VALIDITY_PADDING_SECONDS;

    if (messageValidityPeriod < 0) {
      // this is an edge case
      // it means the message arrived in this function already too late to be sent
      // pass the negative validity period to twilio, and let twilio respond with an error
    }

    if (twilioValidityPeriod) {
      twilioValidityPeriod = Math.min(
        twilioValidityPeriod,
        messageValidityPeriod,
        MAX_TWILIO_MESSAGE_VALIDITY
      );
    } else {
      twilioValidityPeriod = Math.min(
        messageValidityPeriod,
        MAX_TWILIO_MESSAGE_VALIDITY
      );
    }
  }

  if (twilioValidityPeriod) {
    messageParams.validityPeriod = twilioValidityPeriod;
  }

  // Allow us to drop a fixed % of texts for development and testing of large
  // volume sends
  if (shouldDropMessage(message.contact_number)) {
    return await Message.save(
      {
        ...message,
        messaging_service_sid: messagingServiceSid,
        service_id: randomSecret(),
        service_response: "xxxfakexxx",
        send_status: "SENT",
        service: "twilio",
        sent_at: new Date()
      },
      { conflict: "update" }
    );
  }

  // Allow us to completely skip twilio and just autoreply in development
  if (process.env.SKIP_TWILIO_AND_AUTOREPLY === "1") {
    log.info("Skipping twilio and simulating a reply");
    const messageSid = randomSecret();

    const sentMessage = await Message.save(
      {
        ...message,
        messaging_service_sid: messagingServiceSid,
        service_id: messageSid,
        service_response: "xxxfakexxx",
        send_status: "SENT",
        service: "twilio",
        sent_at: new Date()
      },
      { conflict: "update" }
    );

    if (messageParams.body.toLowerCase() == "done") {
      return sentMessage;
    }

    setTimeout(async () => {
      // after 250ms, submit a delivery report
      await handleDeliveryReport({
        MessageSid: messageSid,
        MessageStatus: "delivered"
      });

      // after another 250ms, simulate a response
      await new Promise(res => setTimeout(res, 250));
      await handleIncomingMessage({
        From: messageParams.to,
        To: "+15555555555",
        Body: messageParams.body + " (autoreply)",
        MessageSid: randomSecret(),
        MessagingServiceSid: messageParams.messagingServiceSid,
        NumMedia: 0
      });
    }, 250);

    return sentMessage;
  }

  let hasError = false;
  let err;
  let response;
  try {
    response = await twilio.messages.create(messageParams);
  } catch (e) {
    log.info(e, "Error sending message");

    err = e;
    hasError = true;
  }

  const messageToSave = {
    ...message,
    messaging_service_sid: messagingServiceSid
  };

  if (err) {
    hasError = true;
    log.info("Error sending message", err);
    messageToSave.service_response = JSON.stringify(err);
  }

  if (response) {
    messageToSave.service_id = response.sid;
    hasError = !!response.error_code;
    messageToSave.service_response = JSON.stringify(response);
  }

  if (hasError) {
    const SENT_STRING = '"status"'; // will appear in responses
    if (
      messageToSave.service_response.split(SENT_STRING).length >=
      MAX_SEND_ATTEMPTS + 1
    ) {
      messageToSave.send_status = "ERROR";
    }
    const options = { conflict: "update" };
    if (trx) {
      options.transaction = trx;
    }

    log.debug("messageToSave", messageToSave);
    await Message.save(messageToSave, options);

    throw new Error(JSON.stringify(response));
  } else {
    const options = { conflict: "update" };
    if (trx) {
      options.transaction = trx;
    }

    log.debug("messageToSave", messageToSave);
    return await Message.save(
      {
        ...messageToSave,
        send_status: "SENT",
        service: "twilio",
        sent_at: new Date()
      },
      options
    );
  }
}

async function handleDeliveryReport(report) {
  const { MessageSid: messageSid, MessageStatus: messageStatus } = report;
  if (!messageSid) {
    return;
  }

  // Scalability: we don't care about "queued" and "sent" status updates so
  // we skip writing to the database.
  // Log just in case we need to debug something. Detailed logs can be viewed here:
  // https://www.twilio.com/log/sms/logs/<SID>
  log.info(`Message status ${messageSid}: ${messageStatus}`);
  if (messageStatus === "queued" || messageStatus === "sent") {
    return;
  }

  const message = await r
    .table("message")
    .getAll(messageSid, { index: "service_id" })
    .limit(1)(0)
    .default(null);
  if (message) {
    message.service_response_at = new Date();
    if (messageStatus === "delivered") {
      message.send_status = "DELIVERED";
    } else if (messageStatus === "failed" || messageStatus === "undelivered") {
      message.send_status = "ERROR";
    }
    Message.save(message, { conflict: "update" });
  }
}

/**
 * Warren version of the incoming message handler that doesn't write
 * PendingMessageParts and therefore can't be used with the async worker code.
 *
 * @return void, this response was ignored by the twilio handler anyway and was
 * the id of an already-deleted message part when doing synchronous processing.
 */
async function handleIncomingMessage(twilioMessage) {
  if (
    !twilioMessage.hasOwnProperty("From") ||
    !twilioMessage.hasOwnProperty("To") ||
    !twilioMessage.hasOwnProperty("Body") ||
    !twilioMessage.hasOwnProperty("MessageSid")
  ) {
    log.error(
      `This is not an incoming message: ${JSON.stringify(twilioMessage)}`
    );
    return;
  }

  const { From, To, MessageSid, MessagingServiceSid } = twilioMessage;

  let contactNumber;
  let messageBody;
  if (
    process.env.OVERRIDE_RECIPIENT &&
    From === process.env.OVERRIDE_RECIPIENT
  ) {
    // This is a reply from the overriden recipient. We want to pretend it came from the
    // original recipient, and we can assume that the overrider is a auto-reply bot that
    // reflects back the message we sent. In override mode, the message includes the
    // original recipient.
    messageBody = twilioMessage.Body.replace(
      /^\[(.*?)\] /,
      (__, matchGroup) => {
        contactNumber = getFormattedPhoneNumber(matchGroup);
        return "";
      }
    );

    if (!contactNumber) {
      log.error(
        `Got a reply from the OVERRIDE_RECIPIENT that didn't include the original phone number: ${messageBody}`
      );
      return;
    }
  } else {
    contactNumber = getFormattedPhoneNumber(From);
    messageBody = twilioMessage.Body;
  }

  const userNumber = To ? getFormattedPhoneNumber(To) : "";

  const lastOutbound = await getLastMessage({
    contactNumber,
    messagingServiceSid: MessagingServiceSid,
    service: "twilio"
  });

  // NOTE: we intentionally drop inbound messages that don't have a matching
  // outbound because they currently wouldn't go anywhere and are probably spam.
  if (!lastOutbound) {
    log.error(
      `Couldn't find a matching outbound message for: ${JSON.stringify(
        twilioMessage
      )}`
    );
    return;
  }

  const attachments = [];
  for (let i = 0; i < Number(twilioMessage.NumMedia); i++) {
    attachments.push({
      url: twilioMessage[`MediaUrl${i}`],
      contentType: twilioMessage[`MediaContentType${i}`]
    });
  }

  const messageModel = new Message({
    contact_number: contactNumber,
    user_number: userNumber,
    is_from_contact: true,
    text: messageBody,
    attachments: JSON.stringify(attachments),
    service_response: JSON.stringify(twilioMessage),
    service_id: MessageSid,
    messaging_service_sid: MessagingServiceSid,
    assignment_id: lastOutbound.assignment_id,
    service: "twilio",
    send_status: "DELIVERED" // TODO[matteo]: this doesn't look right!
  });

  await saveNewIncomingMessage(messageModel);
}

// // NOTE: the commented section below is a lightly modified handleIncomingMessage
// //  that works with the Warren fork's handling of multiple messaging service.
// //  this should be usable for an async job with a few modifications (primarily adding
// //  messaging_service_sid to PendingMessagePart), but it was not tested!
// async function convertMessagePartsToMessage(
//   messageParts,
//   messageSid,
//   messagingServiceSid
// ) {
//   const firstPart = messageParts[0];
//   const userNumber = firstPart.user_number;
//   const contactNumber = firstPart.contact_number;
//   const serviceMessages = messageParts.map(part =>
//     JSON.parse(part.service_message)
//   );
//   const text = serviceMessages
//     .map(serviceMessage => serviceMessage.Body)
//     .join("");
//
//   const lastMessage = await getLastMessage({
//     contactNumber,
//     messagingServiceSid,
//     service: "twilio"
//   });
//
//   return new Message({
//     contact_number: contactNumber,
//     user_number: userNumber,
//     is_from_contact: true,
//     text,
//     service_response: JSON.stringify(serviceMessages),
//     service_id: messageSid,
//     messaging_service_sid: messagingServiceSid,
//     assignment_id: lastMessage.assignment_id,
//     service: "twilio",
//     send_status: "DELIVERED"
//   });
// }
//
// async function handleIncomingMessage(message) {
//   if (
//     !message.hasOwnProperty("From") ||
//     !message.hasOwnProperty("To") ||
//     !message.hasOwnProperty("Body") ||
//     !message.hasOwnProperty("MessageSid")
//   ) {
//     log.error(`This is not an incoming message: ${JSON.stringify(message)}`);
//     // Note: Warren version has an early return here
//   }
//
//   const { From, To, MessageSid, MessagingServiceSid } = message;
//   const contactNumber = getFormattedPhoneNumber(From);
//   const userNumber = To ? getFormattedPhoneNumber(To) : "";
//
//   const pendingMessagePart = new PendingMessagePart({
//     service: "twilio",
//     service_id: MessageSid,
//     parent_id: null,
//     service_message: JSON.stringify(message),
//     user_number: userNumber,
//     contact_number: contactNumber
//   });
//
//   const part = await pendingMessagePart.save();
//   const partId = part.id;
//
//   if (process.env.JOBS_SAME_PROCESS) {
//     const finalMessage = await convertMessagePartsToMessage(
//       [part],
//       MessageSid,
//       MessagingServiceSid
//     );
//     await saveNewIncomingMessage(finalMessage);
//     await r
//       .knex("pending_message_part")
//       .where("id", partId)
//       .delete();
//   }
//   return partId;
// }

async function createMessagingService(friendlyName) {
  return await twilio.messaging.services.create({
    friendlyName,
    statusCallback: urlJoin(baseCallbackUrl, "/twilio-message-report"),
    inboundRequestUrl: urlJoin(baseCallbackUrl, "/twilio")
  });
}

async function buyNumber(phoneNumber, opts) {
  return twilio.incomingPhoneNumbers.create({
    phoneNumber,
    friendlyName:
      opts.friendlyName || `Spoke [${process.env.BASE_URL}] ${phoneNumber}`,
    voiceUrl: process.env.TWILIO_VOICE_URL // will use default twilio recording if undefined
  });
}

async function bulkRequest(array, fn) {
  const chunks = _.chunk(array, BULK_REQUEST_CONCURRENCY);
  const results = [];
  for (const chunk of chunks) {
    results.push(...(await Promise.all(chunk.map(fn))));
  }
  return results;
}

/**
 * Bulk remove numbers from a Messaging Service.
 *
 * This operation keeps numbers in the Account's inventory and makes them available to
 * other Messaging Services.
 *
 * Failures can be ignored with 'ignoreFailures', which is useful if you aren't sure
 * which numbers are part of the messaging service, e.g. when rolling back after
 * a failure in addNumbersToMessagingService.
 */
async function removeNumbersFromMessagingService(
  phoneSids,
  messagingServiceSid,
  ignoreFailure = true
) {
  return await bulkRequest(phoneSids, async phoneNumberSid => {
    try {
      return await twilio.messaging
        .services(messagingServiceSid)
        .phoneNumbers(phoneNumberSid)
        .remove();
    } catch (e) {
      log.warn({
        msg: "Error removing numbers from a Messaging Service",
        error: e,
        ignoreFailure
      });
      if (ignoreFailure) {
        return e;
      }
      throw e;
    }
  });
}

async function addNumbersToMessagingService(phoneSids, messagingServiceSid) {
  return await bulkRequest(phoneSids, async phoneNumberSid =>
    twilio.messaging
      .services(messagingServiceSid)
      .phoneNumbers.create({ phoneNumberSid })
  );
}

async function deleteMessagingService(messagingServiceSid) {
  return twilio.messaging.services(messagingServiceSid).remove();
}

export default {
  MAX_NUMBERS_PER_MESSAGING_SERVICE,
  syncMessagePartProcessing: true,
  // Warren fork, async message processing not supported:
  // syncMessagePartProcessing: !!process.env.JOBS_SAME_PROCESS,
  // convertMessagePartsToMessage,
  webhook,
  sendMessage,
  handleDeliveryReport,
  handleIncomingMessage,
  createMessagingService,
  deleteMessagingService,
  removeNumbersFromMessagingService,
  addNumbersToMessagingService
};
