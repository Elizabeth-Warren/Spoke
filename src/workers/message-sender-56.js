import { messageSender56 } from "./job-processes";
import { log } from "../lib";

messageSender56().catch(err => {
  log.info(err);
});
