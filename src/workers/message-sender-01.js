import { messageSender01 } from "./job-processes";
import { log } from "../lib";

messageSender01().catch(err => {
  log.info(err);
});
