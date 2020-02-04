import { messageSender789 } from "./job-processes";
import { log } from "../lib";

messageSender789().catch(err => {
  log.info(err);
});
