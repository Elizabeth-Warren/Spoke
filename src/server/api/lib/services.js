import twilio from "./twilio";
import fakeservice from "./fakeservice";

// TODO: Remove all references to nexmo
// import nexmo from "./nexmo";

// Each service needs the following api points:
// async sendMessage(message, contact, trx) -> void
// To receive messages from the outside, you will probably need to implement these, as well:
// async handleIncomingMessage(<native message format>) -> saved (new) messagePart.id
// async convertMessagePartsToMessage(messagePartsGroupedByMessage) -> new Message() <unsaved>

const serviceMap = {
  // TODO: Remove all references to nexmo
  //   nexmo,
  twilio,
  fakeservice
};

export default serviceMap;
