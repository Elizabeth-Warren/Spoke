import OptOut from "./opt-out";
import { r } from "../models";
import log from "src/server/log";

let tracingEnabled = false;
function enableTracing() {
  if (!tracingEnabled) {
    r.knex.on("query", ({ sql, bindings }) => log.trace(sql, bindings));
  }
  tracingEnabled = true;
}

export default {
  enableTracing,
  OptOut
};
