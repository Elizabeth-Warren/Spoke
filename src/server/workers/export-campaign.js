import { r, Campaign, User } from "../models";
import log from "src/server/log";
import AWS from "aws-sdk";
import Papa from "papaparse";
import moment from "moment";
import { sendEmail } from "../mail";
import BackgroundJob from "src/server/db/background-job";

const EXPORT_S3_PATH = "campaign-exports/";

export async function exportCampaign(job) {
  const payload = JSON.parse(job.config);
  const id = job.campaignId;
  const campaign = await Campaign.get(id);
  const requester = payload.requester;
  const user = await User.get(requester);
  const allQuestions = {};
  const questionCount = {};
  const interactionSteps = await r
    .table("interaction_step")
    .getAll(id, { index: "campaign_id" });

  interactionSteps.forEach(step => {
    if (!step.question || step.question.trim() === "") {
      return;
    }

    if (questionCount.hasOwnProperty(step.question)) {
      questionCount[step.question] += 1;
    } else {
      questionCount[step.question] = 0;
    }
    const currentCount = questionCount[step.question];
    if (currentCount > 0) {
      allQuestions[step.id] = `${step.question}_${currentCount}`;
    } else {
      allQuestions[step.id] = step.question;
    }
  });

  let finalCampaignResults = [];
  let finalCampaignMessages = [];
  const assignments = await r
    .knex("assignment")
    .where("campaign_id", id)
    .join("user", "user_id", "user.id")
    .select(
      "assignment.id as id",
      // user fields
      "first_name",
      "last_name",
      "email",
      "cell",
      "assigned_cell"
    );
  const assignmentCount = assignments.length;

  for (let index = 0; index < assignmentCount; index++) {
    const assignment = assignments[index];
    const optOuts = await r
      .table("opt_out")
      .getAll(assignment.id, { index: "assignment_id" });

    const contacts = await r
      .knex("campaign_contact")
      .leftJoin("zip_code", "zip_code.zip", "campaign_contact.zip")
      .select()
      .where("assignment_id", assignment.id);
    const messages = await r
      .table("message")
      .getAll(assignment.id, { index: "assignment_id" });
    let convertedMessages = messages.map(message => ({
      assignmentId: message.assignment_id,
      campaignId: campaign.id,
      userNumber: message.user_number,
      contactNumber: message.contact_number,
      isFromContact: message.is_from_contact,
      sendStatus: message.send_status,
      attemptedAt: moment(message.created_at).toISOString(),
      text: message.text,
      attachments: message.attachments
    }));

    convertedMessages = await Promise.all(convertedMessages);
    finalCampaignMessages = finalCampaignMessages.concat(convertedMessages);
    let convertedContacts = contacts.map(async contact => {
      const contactRow = {
        campaignId: campaign.id,
        campaign: campaign.title,
        assignmentId: assignment.id,
        "texter[firstName]": assignment.first_name,
        "texter[lastName]": assignment.last_name,
        "texter[email]": assignment.email,
        "texter[cell]": assignment.cell,
        "texter[assignedCell]": assignment.assigned_cell,
        "contact[firstName]": contact.first_name,
        "contact[lastName]": contact.last_name,
        "contact[cell]": contact.cell,
        "contact[zip]": contact.zip,
        "contact[city]": contact.city ? contact.city : null,
        "contact[state]": contact.state ? contact.state : null,
        "contact[optOut]": optOuts.find(ele => ele.cell === contact.cell)
          ? "true"
          : "false",
        "contact[messageStatus]": contact.message_status,
        "contact[external_id]": contact.external_id
      };
      const customFields = JSON.parse(contact.custom_fields);
      Object.keys(customFields).forEach(fieldName => {
        contactRow[`contact[${fieldName}]`] = customFields[fieldName];
      });

      const questionResponses = await r
        .table("question_response")
        .getAll(contact.id, { index: "campaign_contact_id" });

      Object.keys(allQuestions).forEach(stepId => {
        let value = "";
        questionResponses.forEach(response => {
          if (response.interaction_step_id === parseInt(stepId, 10)) {
            value = response.value;
          }
        });

        contactRow[`question[${allQuestions[stepId]}]`] = value;
      });

      return contactRow;
    });
    convertedContacts = await Promise.all(convertedContacts);
    finalCampaignResults = finalCampaignResults.concat(convertedContacts);
    await BackgroundJob.updateStatus(job.id, {
      progress: index / assignmentCount,
      status: BackgroundJob.STATUS.RUNNING
    });
  }
  const campaignCsv = Papa.unparse(finalCampaignResults);
  const messageCsv = Papa.unparse(finalCampaignMessages);

  if (
    process.env.AWS_ACCESS_AVAILABLE ||
    (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
  ) {
    if (!process.env.AWS_S3_BUCKET_NAME) {
      log.error("Missing AWS_S3_BUCKET_NAME env var, aborting export.");
      return;
    }
    try {
      const s3bucket = new AWS.S3({
        params: { Bucket: process.env.AWS_S3_BUCKET_NAME }
      });
      const campaignTitle = campaign.title
        .replace(/ /g, "_")
        .replace(/\//g, "_");
      const keyPrefix = `${EXPORT_S3_PATH}${campaignTitle}-${moment().format(
        "YYYY-MM-DD-HH-mm-ss"
      )}`;
      const key = `${keyPrefix}.csv`;
      const messageKey = `${keyPrefix}-messages.csv`;

      let params = { Key: key, Body: campaignCsv };
      await s3bucket.putObject(params).promise();
      params = { Key: key, Expires: 86400 };
      const campaignExportUrl = await s3bucket.getSignedUrl(
        "getObject",
        params
      );
      params = { Key: messageKey, Body: messageCsv };
      await s3bucket.putObject(params).promise();
      params = { Key: messageKey, Expires: 86400 };
      const campaignMessagesExportUrl = await s3bucket.getSignedUrl(
        "getObject",
        params
      );
      await sendEmail({
        to: user.email,
        subject: `Export ready for ${campaign.title}`,
        text: `Your Spoke exports are ready! These URLs will be valid for 24 hours.
        Campaign export: ${campaignExportUrl}
        Message export: ${campaignMessagesExportUrl}`
      }).catch(err => {
        log.error(err);
        log.info(`Campaign Export URL - ${campaignExportUrl}`);
        log.info(`Campaign Messages Export URL - ${campaignMessagesExportUrl}`);
      });
      log.info(`Successfully exported ${id}`);
    } catch (err) {
      log.error(err);
      await sendEmail({
        to: user.email,
        subject: `Export failed for ${campaign.title}`,
        text: `Your Spoke exports failed... please try again later.
        Error: ${err.message}`
      });
    }
  } else {
    log.debug("Would have saved the following to S3:");
    log.debug(campaignCsv);
    log.debug(messageCsv);
  }
}
