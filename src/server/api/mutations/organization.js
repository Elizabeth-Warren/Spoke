import { organizationCache } from "src/server/models/cacheable_queries/organization";
import { Organization } from "src/server/models";
import { accessRequired } from "src/server/api/errors";

async function setOrganizationFeature(organizationId, key, value) {
  const organization = await Organization.get(organizationId);
  const featuresJSON = JSON.parse(organization.features || "{}");
  featuresJSON[key] = value;
  organization.features = JSON.stringify(featuresJSON);

  await organization.save();
  await organizationCache.clear(organizationId);
  return await Organization.get(organizationId);
}

export const mutations = {
  // TODO: change to setOrganizationFeature mutation
  enableCampaignPhoneNumbers: async (_, { organizationId }, { user }) => {
    await accessRequired(user, organizationId, "OWNER");
    return await setOrganizationFeature(
      organizationId,
      "campaignPhoneNumbersEnabled",
      true
    );
  },
  updateOptOutMessage: async (
    _,
    { organizationId, optOutMessage },
    { user }
  ) => {
    await accessRequired(user, organizationId, "OWNER");
    return await setOrganizationFeature(
      organizationId,
      "opt_out_message",
      optOutMessage
    );
  }
};
