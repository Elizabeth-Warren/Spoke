import moment from "moment";
import AWS from "aws-sdk";
import log from "src/server/log";

const stage = process.env.STAGE || "local";
const functionName = process.env.AWS_LAMBDA_FUNCTION_NAME || "NOT_SET";

// default no-ops
let reportEvent = (detailType, details) =>
  log.info({ msg: "TELEMETRY EVENT", detailType, details });
let reportError = (err, details) =>
  log.error({ msg: "TELEMETRY ERROR", err, details });
let expressMiddleware = (err, req, res, next) => next(err);

const makeCloudwatchEvent = (detailType, details) => {
  return {
    Entries: [
      {
        Time: moment.utc().format(),
        Source: `ew.${stage}.spoke`,
        Resources: [functionName],
        DetailType: detailType,
        Detail: JSON.stringify({
          stage,
          ...details
        })
      }
    ]
  };
};

const makeCloudwatchErrorEvent = (err, details) => {
  const errDetails = {
    traceback: err.stack,
    message: err.message,
    ...details
  };
  return makeCloudwatchEvent("Application Exception", errDetails);
};

// Specific to the Warren AWS deploy: report a cloudwatch event to "Mission Control"
if (process.env.ENABLE_CLOUDWATCH_REPORTING === "1") {
  const cloudwatchClient = new AWS.CloudWatchEvents();

  reportError = async (err, details) => {
    const payload = makeCloudwatchErrorEvent(err, details);
    try {
      await cloudwatchClient.putEvents(payload).promise();
    } catch (e) {
      log.error({
        msg: "Error posting exception to Cloudwatch:",
        error: e,
        payload
      });
    }
  };

  reportEvent = async (detailType, details) => {
    const payload = makeCloudwatchEvent(detailType, details);
    try {
      await cloudwatchClient.putEvents(payload).promise();
    } catch (e) {
      log.error({
        msg: "Error posting event to Cloudwatch:",
        error: e,
        payload
      });
    }
  };

  expressMiddleware = (err, req, res, next) => {
    cloudwatchClient.putEvents(makeCloudwatchErrorEvent(err), awsErr => {
      log.error("Error posting exception to Cloudwatch:", awsErr);
      next(err);
    });
  };
}

export default {
  reportError,
  reportEvent,
  expressMiddleware
};
