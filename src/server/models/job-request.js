import thinky from "./thinky";
const type = thinky.type;
import { optionalString, requiredString, timestamp } from "./custom-types";

import Campaign from "./campaign";

const JobRequest = thinky.createModel(
  "job_request",
  type
    .object()
    .schema({
      id: type.string(),
      campaign_id: requiredString(),
      payload: requiredString(),
      queue_name: requiredString(), // TODO: drop/make optional
      job_type: requiredString(),
      result_message: type.string().default(""),
      locks_queue: type // TODO: drop/make optional
        .boolean()
        .required()
        .default(false),
      assigned: type // TODO: drop/make optional
        .boolean()
        .required()
        .default(false),
      status: type
        .number()
        .integer()
        .required()
        .default(0),
      updated_at: timestamp(),
      created_at: timestamp()
    })
    .allowExtra(false),
  { noAutoCreation: true }
);

export default JobRequest;
