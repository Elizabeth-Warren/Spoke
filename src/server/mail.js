import log from "src/server/log";
import aws from "aws-sdk";
import config from "./config";

let ses;
if (process.env.EMAIL_ENABLED) {
  if (!process.env.EMAIL_FROM) {
    log.warn(
      "Found env var EMAIL_ENABLED without EMAIL_FROM, email will be disabled."
    );
  } else if (!process.env.SES_REGION) {
    log.warn(
      "Found env var EMAIL_ENABLED without SES_REGION, email will be disabled."
    );
  } else {
    ses = new aws.SES({ region: process.env.SES_REGION });
  }
}

export const sendEmail = ({ to, subject, text, replyTo }) => {
  log.info(`Sending e-mail to ${to} with subject ${subject}.`);
  if (!ses) {
    log.debug(`Would send e-mail with subject ${subject} and text ${text}.`);
    return Promise.resolve();
  }

  const params = {
    Destination: {
      ToAddresses: [to]
    },
    Message: {
      Body: { Text: { Data: text } },
      Subject: { Data: subject }
    },
    Source: process.env.EMAIL_FROM
  };

  const replyAddr = replyTo || process.env.EMAIL_REPLY_TO;
  if (replyAddr) {
    params.ReplyToAddresses = [replyAddr];
  }

  return ses.sendEmail(params).promise();
};

export const sendTemplatedEmail = async ({
  to,
  replyTo,
  template,
  templateData
}) => {
  log.debug({ templateData, template }, `Sending e-mail templated to ${to}.`);
  if (!ses) {
    log.info(
      { templateData, template },
      `Skipping send to ${to} because email is disabled`
    );
    return;
  }

  const params = {
    Source: process.env.EMAIL_FROM,
    Destination: {
      ToAddresses: [to]
    },
    ConfigurationSetName: config.SES_CONFIGURATION_SET_NAME,
    Template: template,
    TemplateData: JSON.stringify({
      email: to,
      ...templateData
    })
  };

  const replyAddr = replyTo || process.env.EMAIL_REPLY_TO;
  if (replyAddr) {
    params.ReplyToAddresses = [replyAddr];
  }

  try {
    await ses.sendTemplatedEmail(params).promise();
  } catch (e) {
    log.error(
      { exception: e, templateData, template },
      "Failed to send templated email"
    );
  }
};
