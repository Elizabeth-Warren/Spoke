import DataLoader from "dataloader";
import { cacheableData } from "src/server/models/cacheable_queries";
import {
  Assignment,
  Campaign,
  CampaignContact,
  InteractionStep,
  Message,
  OptOut,
  Organization,
  CannedResponse,
  QuestionResponse,
  Tag,
  UserOrganization,
  User,
  ZipCode
} from "src/server/models";

function createLoader(model, opts) {
  const idKey = (opts && opts.idKey) || "id";
  const cacheObj = opts && opts.cacheObj;
  return new DataLoader(async keys => {
    if (cacheObj && cacheObj.load) {
      return keys.map(async key => await cacheObj.load(key));
    }
    const docs = await model.getAll(...keys, { index: idKey });
    return keys.map(key =>
      docs.find(doc => doc[idKey].toString() === key.toString())
    );
  });
}

export const createLoaders = () => ({
  assignment: createLoader(Assignment),
  campaign: createLoader(Campaign, { cacheObj: cacheableData.campaign }),
  organization: createLoader(Organization, {
    cacheObj: cacheableData.organization
  }),
  user: createLoader(User),
  interactionStep: createLoader(InteractionStep),
  campaignContact: createLoader(CampaignContact),
  zipCode: createLoader(ZipCode, { idKey: "zip" }),
  cannedResponse: createLoader(CannedResponse),
  message: createLoader(Message),
  optOut: createLoader(OptOut),
  tag: createLoader(Tag),
  questionResponse: createLoader(QuestionResponse),
  userOrganization: createLoader(UserOrganization)
});
