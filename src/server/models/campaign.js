import thinky from "./thinky";
const type = thinky.type;
import { requiredString, optionalString, timestamp } from "./custom-types";

const Campaign = thinky.createModel(
  "campaign",
  type
    .object()
    .schema({
      id: type.string(),
      organization_id: requiredString(),
      creator_id: type
        .string()
        .allowNull(true)
        .foreign("user"),
      title: optionalString(),
      description: optionalString(),
      is_started: type.boolean().required(),
      started_at: timestamp().allowNull(true),
      due_by: type
        .date()
        .required()
        .default(null),
      created_at: timestamp(),
      is_archived: type.boolean().required(),
      use_dynamic_assignment: type.boolean().required(),
      logo_image_url: type.string(),
      intro_html: type.string(),
      primary_color: type.string(),
      override_organization_texting_hours: type
        .boolean()
        .required()
        .default(false),
      texting_hours_enforced: type
        .boolean()
        .required()
        .default(true),
      texting_hours_start: type
        .number()
        .integer()
        .required()
        .min(0)
        .max(23)
        .default(9),
      texting_hours_end: type
        .number()
        .integer()
        .required()
        .min(0)
        .max(23)
        .default(21),
      timezone: type
        .string()
        .required()
        .default("US/Eastern"),
      messaging_service_sid: type.string().allowNull(true),
      shifting_configuration: type.string().allowNull(true),
      join_token: type.string().allowNull(true)
    })
    .allowExtra(false),
  { noAutoCreation: true }
);

export default Campaign;
