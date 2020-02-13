import Assignment from "./assignment";
import Campaign from "./campaign";
import OptOut from "./opt-out";
import TwilioPhoneNumber from "./twilio-phone-number";
import User from "./user";

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
  // Utils
  enableTracing,
  transaction,
  Table,
  // Queries
  Assignment,
  Campaign,
  OptOut,
  TwilioPhoneNumber,
  User
};
