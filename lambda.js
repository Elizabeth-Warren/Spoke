"use strict";
const awsServerlessExpress = require("aws-serverless-express");

// TODO Babel
let app;
try {
  app = require("./build/server/server/index");
} catch (err) {
  if (!global.TEST_ENVIRONMENT) {
    console.error(`Unable to load built server: ${err}`);
  }
  app = require("./src/server/index");
}
const server = awsServerlessExpress.createServer(app.default);

// NOTE: the downside of loading above is environment variables are initially loaded immediately,
//       so changing them means that the code must test environment variable inline (rather than use a const set on-load)
// We should NOT load app and server inside the handler, or all connection pools and state are re-instantiated per-request:
// See: http://docs.aws.amazon.com/lambda/latest/dg/best-practices.html#function-code
// "Separate the Lambda handler (entry point) from your core logic"

let invocationContext = {};
let invocationEvent = {};
app.default.set("awsContextGetter", function(req, res) {
  return [invocationEvent, invocationContext];
});

function cleanHeaders(event) {
  // X-Twilio-Body can contain unicode and disallowed chars by aws-serverless-express like "'"
  // We don't need it anyway
  if (event.headers) {
    delete event.headers["X-Twilio-Body"];
  }
  if (event.multiValueHeaders) {
    delete event.multiValueHeaders["X-Twilio-Body"];
  }
}

exports.handler = async (event, context) => {
  if (process.env.LAMBDA_DEBUG_LOG) {
    console.log("LAMBDA EVENT", event);
  }
  const startTime = context.getRemainingTimeInMillis
    ? context.getRemainingTimeInMillis()
    : 0;
  invocationEvent = event;
  invocationContext = context;
  cleanHeaders(event);
  const webResponse = awsServerlessExpress.proxy(
    server,
    event,
    context,
    "PROMISE"
  ).promise;
  if (process.env.DEBUG_SCALING) {
    const endTime = context.getRemainingTimeInMillis
      ? context.getRemainingTimeInMillis()
      : 0;
    if (endTime - startTime > 3000) {
      //3 seconds
      console.log("SLOW_RESPONSE milliseconds:", endTime - startTime, event);
    }
  }

  return webResponse;
};
