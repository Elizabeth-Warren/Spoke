import log from "src/server/log";
import Assignment from "./assignment";
import BackgroundJob from "./background-job";
import Campaign from "./campaign";
import CannedResponse from "./canned-response";
import Label from "./label";
import OptOut from "./opt-out";
import TwilioPhoneNumber from "./twilio-phone-number";
import User from "./user";
import Notification from "./notification";

import { knex, Table, transaction } from "./common";

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
  BackgroundJob,
  Campaign,
  CannedResponse,
  Label,
  OptOut,
  TwilioPhoneNumber,
  User,
  Notification
};
