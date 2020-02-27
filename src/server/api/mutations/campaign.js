import { Campaign } from "src/server/models";
import { cacheableData } from "src/server/models/cacheable_queries";
import {
  accessRequired,
  ApolloError,
  UserInputError
} from "src/server/api/errors";
import db from "src/server/db";
import BackgroundJob from "src/server/db/background-job";
import { JobType, dispatchJob } from "src/server/workers";
import { CampaignStatus } from "../../../lib/campaign-statuses";

export const mutations = {
  startCampaign: async (_, { id }, { user }) => {
    const campaign = await Campaign.get(id);
    await accessRequired(user, campaign.organization_id, "ADMIN");
    // Prevent duplicate jobs from getting enqueued
    const job = await db.transaction(async transaction => {
      await transaction.raw("LOCK TABLE background_job IN EXCLUSIVE MODE");
      const existing = await BackgroundJob.getByTypeAndCampaign(
        JobType.START_CAMPAIGN,
        id,
        { transaction }
      );
      if (existing && existing.status !== db.BackgroundJob.STATUS.FAILED) {
        throw new ApolloError(
          "This campaign has started or is in the process of starting",
          "DUPLICATE_CAMPAIGN_START"
        );
      }

      return BackgroundJob.create(
        {
          type: JobType.START_CAMPAIGN,
          campaignId: id,
          organizationId: campaign.organization_id,
          userId: user.id,
          config: JSON.stringify({ campaignId: id })
        },
        { transaction }
      );
    });
    await dispatchJob(job);
    return cacheableData.campaign.reload(id);
  },
  updateCampaignStatus: async (_, { id, status }, { user, loaders }) => {
    const supportedStatuses = [
      CampaignStatus.ACTIVE,
      CampaignStatus.CLOSED,
      CampaignStatus.CLOSED_FOR_INITIAL_SENDS
    ];
    if (supportedStatuses.indexOf(status) === -1) {
      throw new UserInputError(`Setting status ${status} is not supported`);
    }
    const campaign = await loaders.campaign.load(id);
    await accessRequired(user, campaign.organization_id, "ADMIN");

    // you can only transition from any of the supported states to any of the others
    if (supportedStatuses.indexOf(campaign.status) === -1) {
      throw new UserInputError(
        `Cannot transition from ${campaign.status} to ${status}`
      );
    }

    // note: campaign gets passed to legacy resolver so we need to return snake case
    const updated = await db.Campaign.updateStatus(id, status, {
      snakeCase: true
    });
    await cacheableData.campaign.clear(id);
    return updated;
  }
};
