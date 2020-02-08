import { r } from "../../models";
import log from "src/server/log";

export async function getLastMessage({
  contactNumber,
  messagingServiceSid,
  service
}) {
  return await r
    .table("message")
    .getAll(contactNumber, { index: "contact_number" })
    .filter({
      is_from_contact: false,
      service,
      messaging_service_sid: messagingServiceSid
    })
    .orderBy(r.desc("created_at"))
    .limit(1)
    .pluck("assignment_id")(0)
    .default(null);
}

export async function saveNewIncomingMessage(messageInstance) {
  // TODO[matteo]: this should probably all happen in a transaction but I haven't
  //  investigated if it's possible to pass one to thinky.
  if (messageInstance.service_id) {
    const existingMessage = await r
      .knex("message")
      .where("service_id", messageInstance.service_id)
      .first();
    if (existingMessage) {
      log.error(
        "Skipping duplicate message:",
        messageInstance,
        "found:",
        existingMessage
      );
      return;
    }
  }

  await messageInstance.save();
  await r
    .table("campaign_contact")
    .getAll(messageInstance.assignment_id, { index: "assignment_id" })
    .filter({ cell: messageInstance.contact_number })
    .limit(1)
    .update({ message_status: "needsResponse", updated_at: "now()" });
}
