import OptOut from "./opt-out";
import TwilioPhoneNumber from "./twilio-phone-number";
import { knex, Table, transaction } from "./common";
import log from "src/server/log";

let tracingEnabled = false;
function enableTracing() {
  if (!tracingEnabled) {
    knex.on("query", ({ sql, bindings }) => log.trace(sql, bindings));
  }
  tracingEnabled = true;
}

export default {
  enableTracing,
  transaction,
  Table,
  OptOut,
  TwilioPhoneNumber
};
