import thinky from "./thinky";
const type = thinky.type;
import { requiredString, timestamp, optionalString } from "./custom-types";

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
      survey_question: optionalString()
    })
    .allowExtra(false),
  { noAutoCreation: true }
);

export default CannedResponse;
