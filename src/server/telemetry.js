import moment from "moment";
import AWS from "aws-sdk";
import log from "src/server/log";

// default no-ops
let reportError = () => {};
let expressMiddleware = (err, req, res, next) => next(err);

// Specific to the Warren AWS deploy: report a cloudwatch event to "Mission Control"
if (process.env.ENABLE_CLOUDWATCH_REPORTING) {
  const cloudwatchClient = new AWS.CloudWatchEvents();
  const stage = process.env.STAGE || "local";
  const functionName = process.env.AWS_LAMBDA_FUNCTION_NAME || "NOT_SET";
  const makeCloudwatchEvent = (err, details) => {
    return {
      Entries: [
        {
          Time: moment.utc().format(),
          Source: `ew.${stage}.spoke`,
          Resources: [functionName],
          DetailType: "Application Exception",
          Detail: JSON.stringify({
            stage,
            traceback: err.stack,
            message: err.message,
            ...details
          })
        }
      ]
    };
  };

  reportError = async (err, details) => {
    try {
      await cloudwatchClient
        .putEvents(makeCloudwatchEvent(err, details))
        .promise();
    } catch (e) {
      log.error("Error posting exception to Cloudwatch:", e);
    }
  };

  expressMiddleware = (err, req, res, next) => {
    cloudwatchClient.putEvents(makeCloudwatchEvent(err), awsErr => {
      log.error("Error posting exception to Cloudwatch:", awsErr);
      next(err);
    });
  };
}

export default {
  reportError,
  expressMiddleware
};
