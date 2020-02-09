import thinky from "./thinky";

const type = thinky.type;
import { requiredString, optionalString, timestamp } from "./custom-types";

const CampaignContact = thinky.createModel(
  "campaign_contact",
  type
    .object()
    .schema({
      id: type.string(),
      campaign_id: requiredString(),
      assignment_id: optionalString(),
      external_id: optionalString().stopReference(),
      external_id_type: optionalString(),
      first_name: optionalString(),
      last_name: optionalString(),
      cell: requiredString(),
      state_code: optionalString(),
      zip: optionalString(),
      custom_fields: requiredString().default("{}"),
      created_at: timestamp(),
      updated_at: timestamp(),
      message_status: requiredString()
        .enum([
          "needsMessage",
          "needsResponse",
          "convo",
          "messaged",
          "closed",
          "UPDATING"
        ])
        .default("needsMessage"),
      is_opted_out: type.boolean().default(false),
      timezone_offset: type
        .string()
        .default("")
        .required(),
      has_unresolved_tags: type.boolean().default(false)
    })
    .allowExtra(false),
  { noAutoCreation: true }
);

export default CampaignContact;
