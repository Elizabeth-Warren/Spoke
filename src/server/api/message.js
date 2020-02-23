import crypto from "crypto";
import { promisify } from "util";

import { Message, r } from "src/server/models";
import { mapFieldsToModel } from "./lib/utils";
import { ApolloError } from "src/server/api/errors";

const redisSet = promisify(r.redis.set).bind(r.redis);

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

export async function messageDedupe(contact, message, isInitialMessage) {
  const hash = crypto.createHash("sha1");
  hash.update(message.text);

  const messageKey = `spoke-messageDedupe:${contact.id}:${hash.digest(
    "base64"
  )}`;

  const checkResult = await redisSet(
    messageKey,
    "true",
    "EX",
    DEDUPE_EXPIRATION_SECONDS,
    "NX"
  );

  if (!checkResult) {
    if (isInitialMessage) {
      throw new ApolloError("Duplicate initial message", "DUPLICATE_MESSAGE");
    }

    throw new ApolloError("Duplicate reply message", "DUPLICATE_REPLY_MESSAGE");
  }
}
