import moment from "moment";
import AWS from "aws-sdk";
import log from "src/server/log";
import _ from "lodash";
import * as Sentry from "@sentry/node";

const stage = process.env.STAGE || "local";
const functionName = process.env.AWS_LAMBDA_FUNCTION_NAME || "NOT_SET";

// https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/MonitoringLogData.html
let reportMetric = _ => {};
const reportEventCallbacks = [];
const reportErrorCallbacks = [];
const expressMiddlewareCallbacks = [];

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

if (process.env.SENTRY_DSN) {
  const sentryConfig = { dsn: process.env.SENTRY_DSN, environment: stage };

  const sentryDefaultTags = { functionName };
  if (process.env.GIT_COMMIT_SHORT) {
    sentryDefaultTags.gitCommit = process.env.GIT_COMMIT_SHORT;
  }

  if (process.env.GIT_TAGS) {
    const releaseTag = process.env.GIT_TAGS.split(",").find(tag =>
      tag.startsWith("release-")
    );
    if (releaseTag) {
      sentryConfig.release = releaseTag;
    }
  }

  Sentry.init(sentryConfig);

  const reportSentryError = async (err, details = {}) => {
    Sentry.configureScope(scope => {
      if (details.userId) {
        scope.setUser({ id: details.userId });
      }

      if (details.code) {
        scope.setTag("code", details.code);
      }

      if (details.path) {
        scope.setTag("path", details.path);
      }

      _.each(sentryDefaultTags, (val, key) => {
        scope.setTag(key, val);
      });

      _.each(_.omit(details, "userId", "code", "path"), (val, key) => {
        scope.setExtra(key, val);
      });

      Sentry.captureException(err);
    });

    await Sentry.flush(2000);
  };

  reportErrorCallbacks.push(reportSentryError);
  expressMiddlewareCallbacks.push(async (err, req) => {
    await reportSentryError(err, {
      userId: req.user && req.user.id,
      path: req.originalUrl
    });
  });
}

// Specific to the Warren AWS deploy: report a cloudwatch event to "Mission Control"
if (process.env.ENABLE_CLOUDWATCH_REPORTING === "1") {
  const cloudwatchEventsClient = new AWS.CloudWatchEvents();
  const cloudwatchClient = new AWS.CloudWatch();
  const metricNamespace = `ew/${stage}/spoke`;

  reportMetric = async ({ name, value, unit, dimensions }) => {
    const metric = {
      MetricData: [
        {
          MetricName: name,
          Dimensions: dimensions,
          Timestamp: new Date(),
          Unit: unit,
          Value: value
        }
      ],
      Namespace: metricNamespace
    };
    await cloudwatchClient.putMetricData(metric).promise();
  };

  reportErrorCallbacks.push(async (err, details) => {
    const payload = makeCloudwatchErrorEvent(err, details);
    try {
      await cloudwatchEventsClient.putEvents(payload).promise();
    } catch (e) {
      log.error({
        msg: "Error posting exception to Cloudwatch:",
        error: e,
        payload
      });
    }
  });

  reportEventCallbacks.push(async (detailType, details) => {
    const payload = makeCloudwatchEvent(detailType, details);
    try {
      await cloudwatchEventsClient.putEvents(payload).promise();
    } catch (e) {
      log.error({
        msg: "Error posting event to Cloudwatch:",
        error: e,
        payload
      });
    }
  });

  expressMiddlewareCallbacks.push(async (err, req) => {
    await new Promise(resolve => {
      cloudwatchEventsClient.putEvents(
        makeCloudwatchErrorEvent(err),
        awsErr => {
          log.error("Error posting exception to Cloudwatch:", awsErr);
          resolve();
        }
      );
    });
  });
}

// default no-ops
if (reportEventCallbacks.length === 0) {
  reportEventCallbacks.push(async (detailType, details) =>
    log.info({ msg: "TELEMETRY EVENT", detailType, details })
  );
}

if (reportErrorCallbacks.length === 0) {
  reportErrorCallbacks.push(async (err, details) =>
    log.error({ msg: "TELEMETRY ERROR", err, details })
  );
}

async function reportEvent(detailType, details) {
  await Promise.all(reportEventCallbacks.map(cb => cb(detailType, details)));
}

async function reportError(err, details) {
  await Promise.all(reportErrorCallbacks.map(cb => cb(err, details)));
}

function expressMiddleware(err, req, res, next) {
  Promise.all(expressMiddlewareCallbacks.map(cb => cb(err, req, res))).then(
    () => {
      next(err);
    }
  );
}

export default {
  reportMetric,
  reportError,
  reportEvent,
  expressMiddleware
};
