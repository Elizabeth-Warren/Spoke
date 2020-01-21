import thinky from "./thinky";
import {
  optionalString,
  requiredString,
  timestamp,
  optionalTimestamp
} from "./custom-types";

const type = thinky.type;

const Tag = thinky.createModel(
  "tag",
  type
    .object()
    .schema({
      id: type.string(),
      campaign_contact_id: requiredString(),
      tag: requiredString(),
      created_at: timestamp(),
      created_by: requiredString(),
      resolved_at: optionalTimestamp(),
      resolved_by: optionalString()
    })
    .allowExtra(true),
  { noAutoCreation: true }
);

Tag.ensureIndex("campaign_contact_id");
Tag.ensureIndex("tag");

export default Tag;
