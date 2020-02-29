import cloudwatchMetrics from "cloudwatch-metrics";
import config from "src/server/config";
import log from "src/server/log";

const metric = new cloudwatchMetrics.Metric(
  config.CLOUDWATCH_METRICS_NAMESPACE,
  "Milliseconds",
  [],
  {
    enabled: config.CLOUDWATCH_METRICS_ENABLED,
    sendInterval: 30 * 1000,
    sendCallback: (e, _) => {
      if (e) {
        log.warn({ msg: "Error posting metric summary to CW", e });
      }
    }
  }
);

const SLOW_REQUEST_LOG_THRESHOLD = process.env.SLOW_REQUEST_LOG_THRESHOLD
  ? parseInt(process.env.SLOW_REQUEST_LOG_THRESHOLD, 10)
  : 500;

export default function middleware(req, res, next) {
  const start = new Date();
  res.on("finish", () => {
    const end = new Date();
    const duration = end - start;
    if (duration > SLOW_REQUEST_LOG_THRESHOLD) {
      log.info({ msg: "Slow Request", duration, body: req.body });
    }

    metric.summaryPut(duration, "GraphQLResponseTimeSummary", [
      { Name: "OperationName", Value: req.body.operationName || "NOT_SET" }
    ]);
  });
  next();
}
