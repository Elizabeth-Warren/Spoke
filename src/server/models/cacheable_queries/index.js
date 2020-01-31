import userCache from "./user";
import { organizationCache } from "./organization";
import { cannedResponseCache } from "./canned-response";
import { campaignCache } from "./campaign";
import { optOutCache } from "./opt-out";

const cacheableData = {
  campaign: campaignCache,
  cannedResponse: cannedResponseCache,
  optOut: optOutCache,
  organization: organizationCache,
  user: userCache
};

export { cacheableData };
