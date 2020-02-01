import { r } from "../../models";

export async function getLastMessage({
  contactNumber,
  messagingServiceSid,
  service
}) {
  // TODO: switch to knex
  const lastMessage = await r
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

  return lastMessage;
}

export async function saveNewIncomingMessage(messageInstance) {
  // TODO: this has terrible performance, either remove it completely or optimize
  if (messageInstance.service_id) {
    const countResult = await r.getCount(
      r.knex("message").where("service_id", messageInstance.service_id)
    );
    if (countResult) {
      console.error(
        "DUPLICATE MESSAGE SAVED",
        countResult.count,
        messageInstance
      );
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
