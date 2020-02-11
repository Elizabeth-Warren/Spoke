import { Message, r } from "../../models";
import log from "src/server/log";

// This 'fakeservice' allows for fake-sending messages
// that end up just in the db appropriately and then using sendReply() graphql
// queries for the reception (rather than a real service)

async function sendMessage(message, contact, trx) {
  const newMessage = new Message({
    ...message,
    service: "fakeservice",
    send_status: "SENT",
    sent_at: new Date()
  });

  if (message && message.id) {
    let request = r.knex("message");
    if (trx) {
      request = request.transacting(trx);
    }
    // updating message!
    await request.where("id", message.id).update({
      service: "fakeservice",
      send_status: "SENT",
      sent_at: new Date()
    });
  }

  if (contact && /autorespond/.test(message.text)) {
    // We can auto-respond to the the user if they include the text 'autorespond' in their message
    await Message.save({
      ...message,
      // just flip/renew the vars for the contact
      id: undefined,
      service_id: `mockedresponse${Math.random()}`,
      is_from_contact: true,
      text: `responding to ${message.text}`,
      send_status: "DELIVERED"
    });
    contact.message_status = "needsResponse";
    await contact.save();
  }
  return newMessage;
}

export default {
  sendMessage
};
