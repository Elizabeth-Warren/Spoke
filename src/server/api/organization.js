import db from "src/server/db";
import { r, Organization } from "src/server/models";
import { mapFieldsToModel, campaignPhoneNumbersEnabled } from "./lib/utils";
import { accessRequired } from "./errors";
import { getCampaigns } from "./campaign";
import { buildSortedUserOrganizationQuery } from "./user";

import { ApolloError } from "src/server/api/errors";

const Status = db.TwilioPhoneNumber.Status;

export const resolvers = {
  Organization: {
    ...mapFieldsToModel(["id", "name"], Organization),
    campaigns: async (
      organization,
      { cursor, campaignsFilter, sortBy },
      { user }
    ) => {
      await accessRequired(user, organization.id, "SUPERVOLUNTEER");
      return getCampaigns(organization.id, cursor, campaignsFilter, sortBy);
    },
    uuid: async (organization, _, { user }) => {
      await accessRequired(user, organization.id, "SUPERVOLUNTEER");
      const result = await r
        .knex("organization")
        .column("uuid")
        .where("id", organization.id);
      return result[0].uuid;
    },
    optOuts: async (organization, _, { user }) => {
      await accessRequired(user, organization.id, "ADMIN");
      return r
        .table("opt_out")
        .getAll(organization.id, { index: "organization_id" });
    },
    people: async (organization, { role, campaignId, sortBy }, { user }) => {
      await accessRequired(user, organization.id, "SUPERVOLUNTEER");
      const campaignsFilter = { campaignId };
      return buildSortedUserOrganizationQuery(
        organization.id,
        role,
        campaignsFilter,
        sortBy
      );
    },
    threeClickEnabled: organization =>
      organization.features.indexOf("threeClick") !== -1,
    maxContacts: organization => {
      const orgFeatures = JSON.parse(organization.features || "{}");

      return parseInt(
        orgFeatures.hasOwnProperty("maxContacts")
          ? orgFeatures.maxContacts
          : process.env.MAX_CONTACTS || 60000,
        10
      );
    },
    textingHoursEnforced: organization => organization.texting_hours_enforced,
    optOutMessage: organization =>
      (organization.features &&
      organization.features.indexOf("opt_out_message") !== -1
        ? JSON.parse(organization.features).opt_out_message
        : process.env.OPT_OUT_MESSAGE) ||
      "I'm opting you out of texts immediately. Have a great day.",
    textingHoursStart: organization => organization.texting_hours_start,
    textingHoursEnd: organization => organization.texting_hours_end,
    campaignPhoneNumbersEnabled: organization =>
      campaignPhoneNumbersEnabled(organization),
    availablePhoneNumbers: async (organization, _, { user }) => {
      await accessRequired(user, organization.id, "ADMIN");
      if (!campaignPhoneNumbersEnabled(organization)) {
        return [];
      }
      return await db.TwilioPhoneNumber.countByAreaCode({
        status: Status.AVAILABLE
      });
    },
    phoneNumbersByStatus: async (organization, _, { user }) => {
      await accessRequired(user, organization.id, "SUPERVOLUNTEER");
      if (!campaignPhoneNumbersEnabled(organization)) {
        return [];
      }
      return await db.TwilioPhoneNumber.getAreaCodeStatusCounts();
    },
    labels: async (organization, _, { user }) => {
      await accessRequired(user, organization.id, "SUPERVOLUNTEER");
      return db.Label.listForOrganization(organization.id);
    }
  }
};
