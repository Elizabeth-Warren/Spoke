import BackgroundJob from "src/server/db/background-job";
import s3 from "src/server/s3";
import randomSecret from "src/server/random-secret";
import { r } from "src/server/models";
import { GraphQLError } from "graphql/error";
import { accessRequired, UserInputError, ForbiddenError } from "../errors";
import { dispatchJob } from "src/server/workers";

export const mutations = {
  createPresignedUploadUrl: async (_, { organizationId }, { user }) => {
    await accessRequired(user, organizationId, "ADMIN", /* superadmin*/ true);

    const s3Key = `contactUploads/${organizationId}/${randomSecret()}`;

    const presignedPutUrl = s3.getSignedUrl("putObject", {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: s3Key,
      Expires: 900 // 15 minutes
    });

    return JSON.stringify({
      s3Key,
      presignedPutUrl
    });
  },
  uploadContacts: async (_, { campaignId, s3Key }, { user }) => {
    const campaign = await r
      .knex("campaign")
      .where({ id: campaignId })
      .first();

    if (!campaign) {
      throw new UserInputError("No campaign with that ID");
    }

    const organizationId = campaign.organization_id;

    await accessRequired(user, organizationId, "ADMIN", /* superadmin*/ true);

    if (!s3Key.startsWith(`contactUploads/${organizationId}/`)) {
      // To prevent people from accessing contact lists from other organizations,
      // we verify that this contact list was uploaded for this specific organization
      throw new ForbiddenError("Invalid s3 key");
    }

    const job = await BackgroundJob.create({
      type: "upload_contacts",
      campaignId,
      organizationId,
      userId: user.id,
      config: JSON.stringify({ s3Key })
    });

    await dispatchJob(job);

    return job.id;
  }
};
