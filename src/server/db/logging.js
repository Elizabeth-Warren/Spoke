import { r } from "../models";
import { log } from "../../lib/log";

r.knex.on("query", ({ sql, bindings }) => log.debug(sql, bindings));
