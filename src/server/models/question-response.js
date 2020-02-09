import thinky from "./thinky";
const type = thinky.type;
import { requiredString, timestamp } from "./custom-types";

import CampaignContact from "./campaign-contact";
import InteractionStep from "./interaction-step";

const QuestionResponse = thinky.createModel(
  "question_response",
  type
    .object()
    .schema({
      id: type.string(),
      campaign_contact_id: requiredString(),
      interaction_step_id: requiredString(),
      value: requiredString(),
      created_at: timestamp()
    })
    .allowExtra(false),
  { noAutoCreation: true, dependencies: [CampaignContact, InteractionStep] }
);

export default QuestionResponse;
