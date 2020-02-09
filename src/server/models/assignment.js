import thinky from "./thinky";
import { requiredString, timestamp } from "./custom-types";

const type = thinky.type;

const Assignment = thinky.createModel(
  "assignment",
  type
    .object()
    .schema({
      id: type.string(),
      user_id: requiredString(),
      campaign_id: requiredString(),
      created_at: timestamp(),
      max_contacts: type.integer()
    })
    .allowExtra(false),
  { noAutoCreation: true }
);

export default Assignment;
