import userCache from "./user";
import { organizationCache } from "./organization";
import { cannedResponseCache } from "./canned-response";
import { campaignCache } from "./campaign";

const cacheableData = {
  campaign: campaignCache,
  cannedResponse: cannedResponseCache,
  // Note: Not used in the Warren fork see db/opt-out.js:
  // optOut: optOutCache,
  organization: organizationCache,
  user: userCache
};

export { cacheableData };
