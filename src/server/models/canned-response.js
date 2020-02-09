import thinky from "./thinky";
const type = thinky.type;
import {
  requiredString,
  timestamp,
  optionalString,
  requiredInteger
} from "./custom-types";

const CannedResponse = thinky.createModel(
  "canned_response",
  type
    .object()
    .schema({
      id: type.string(),
      campaign_id: requiredString(),
      text: requiredString(),
      title: requiredString(),
      user_id: optionalString(),
      created_at: timestamp(),
      survey_question: optionalString(),
      deleted: type
        .boolean()
        .required()
        .default(false),
      order: type
        .number()
        .integer()
        .required()
        .min(0)
        .default(0)
    })
    .allowExtra(false),
  { noAutoCreation: true }
);

export default CannedResponse;
