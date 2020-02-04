import { messageSender234 } from "./job-processes";
import { log } from "../lib";

messageSender234().catch(err => {
  log.info(err);
});
