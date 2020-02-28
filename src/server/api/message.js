import crypto from "crypto";
import { promisify } from "util";

import { Message, r } from "src/server/models";
import { mapFieldsToModel } from "./lib/utils";
import { ApolloError } from "src/server/api/errors";

const redisSet = promisify(r.redis.set).bind(r.redis);

const DEDUPE_LOCK_EXPIRATION_SECONDS = 2;
const DEDUPE_EXPIRATION_SECONDS = 60 * 60 * 24;

export const resolvers = {
  Message: {
    ...mapFieldsToModel(
      [
        "id",
        "text",
        "userNumber",
        "contactNumber",
        "createdAt",
        "isFromContact",
        "attachments"
      ],
      Message
    ),
    campaignId: instance => instance["campaign_id"]
  }
};

function hashMessageForDedupe(contact, message) {
  const hash = crypto.createHash("sha1");
  hash.update(message.text);

  return `spoke-messageDedupe:${contact.id}:${hash.digest("base64")}`;
}

export async function checkForMessageDuplicate(
  contact,
  message,
  isInitialMessage
) {
  const key = hashMessageForDedupe(contact, message);
  // Rather than using a GET here, we set the key with a short expiration
  // to act as lock on the message, which mitigates a potential race.
  const checkResult = await redisSet(
    key,
    "true",
    "EX",
    DEDUPE_LOCK_EXPIRATION_SECONDS,
    "NX" // Don't overwrite the TTL if the key exists
  );

  if (!checkResult) {
    if (isInitialMessage) {
      throw new ApolloError("Duplicate initial message", "DUPLICATE_MESSAGE");
    }

    throw new ApolloError("Duplicate reply message", "DUPLICATE_REPLY_MESSAGE");
  }
}

export async function putMessageForDedupe(contact, message) {
  const key = hashMessageForDedupe(contact, message);
  await redisSet(key, "true", "EX", DEDUPE_EXPIRATION_SECONDS);
}
