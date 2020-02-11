import { organizationCache } from "src/server/models/cacheable_queries/organization";
import { Organization, UserOrganization } from "src/server/models";
import { accessRequired, superAdminRequired } from "src/server/api/errors";

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
  createOrganization: async (_, { name }, { user }) => {
    if (process.env.SUPPRESS_SELF_INVITE) {
      superAdminRequired(user);
    }

    const newOrganization = await Organization.save({ name });
    await UserOrganization.save({
      role: "OWNER",
      user_id: user.id,
      organization_id: newOrganization.id
    });
    return newOrganization;
  },
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
