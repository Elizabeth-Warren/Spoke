import { log } from "../lib";
import aws from "aws-sdk";

let ses;
if (process.env.EMAIL_ENABLED) {
  if (!process.env.EMAIL_FROM) {
    log.warn(
      "Found env var EMAIL_ENABLED without EMAIL_FROM, email will be disabled."
    );
  } else if (!process.env.AWS_REGION) {
    log.warn(
      "Found env var EMAIL_ENABLED without AWS_REGION, email will be disabled."
    );
  } else {
    ses = new aws.SES({ region: process.env.AWS_REGION });
  }
}

export const sendEmail = ({ to, subject, text, replyTo }) => {
  log.info(`Sending e-mail to ${to} with subject ${subject}.`);
  if (!ses) {
    log.debug(`Would send e-mail with subject ${subject} and text ${text}.`);
    return null;
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

  if (replyTo) {
    params.ReplyToAddresses = [replyTo];
  }

  return ses.sendEmail(params).promise();
};
