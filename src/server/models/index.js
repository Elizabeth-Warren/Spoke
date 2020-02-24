import DataLoader from "dataloader";

// Import models in order that creates referenced tables before foreign keys
import User from "./user";
import Organization from "./organization";
import Campaign from "./campaign";
import Assignment from "./assignment";
import CampaignContact from "./campaign-contact";
import InteractionStep from "./interaction-step";
import QuestionResponse from "./question-response";
import OptOut from "./opt-out";
import CannedResponse from "./canned-response";
import UserOrganization from "./user-organization";
import Message from "./message";
import ZipCode from "./zip-code";
import Tag from "./tag";
import thinky from "./thinky";
import datawarehouse from "./datawarehouse";

import { cacheableData } from "./cacheable_queries";
import log from "src/server/log";

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

const createLoaders = () => ({
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

const r = thinky.r;

export {
  createLoaders,
  r,
  cacheableData,
  datawarehouse,
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
  // Note: not used in the Warren fork
  // Log
};
