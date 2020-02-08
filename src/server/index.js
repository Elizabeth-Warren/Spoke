import "@babel/polyfill";
import bodyParser from "body-parser";
import express from "express";
import appRenderer from "./middleware/app-renderer";
import { graphqlExpress, graphiqlExpress } from "apollo-server-express";
import { makeExecutableSchema, addMockFunctionsToSchema } from "graphql-tools";
// ORDERING: ./models import must be imported above ./api to help circular imports
import { createLoaders } from "./models";
import { resolvers } from "./api/schema";
import { schema } from "src/api/schema";
import mocks from "./api/mocks";
import passport from "passport";
import cookieSession from "cookie-session";
import passportSetup from "./auth-passport";
import wrap from "./wrap";
import log from "src/server/log";
// import nexmo from "./api/lib/nexmo";
import twilio from "./api/lib/twilio";
import { setupUserNotificationObservers } from "./notifications";
import { twiml } from "twilio";
import { existsSync } from "fs";
import sourceMapSupport from "source-map-support";
import telemetry from "./telemetry";
import db from "src/server/db";

db.enableTracing();

// Support source maps in stack traces
sourceMapSupport.install();

process.on("uncaughtException", ex => {
  log.error(ex);
  process.exit(1);
});

const DEBUG = process.env.NODE_ENV === "development";

setupUserNotificationObservers();
const app = express();
// Heroku requires you to use process.env.PORT
const port = process.env.DEV_APP_PORT || process.env.PORT;

// Don't rate limit heroku
app.enable("trust proxy");

// Serve static assets
if (existsSync(process.env.ASSETS_DIR)) {
  app.use(
    "/assets",
    express.static(process.env.ASSETS_DIR, {
      maxAge: "180 days"
    })
  );
}

app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  cookieSession({
    cookie: {
      httpOnly: true,
      secure: !DEBUG,
      maxAge: null
    },
    secret: process.env.SESSION_SECRET || global.SESSION_SECRET
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  const getContext = app.get("awsContextGetter");
  if (typeof getContext === "function") {
    const [event, context] = getContext(req, res);
    req.awsEvent = event;
    req.awsContext = context;
  }
  next();
});

/*

TODO: Delete. We are not using nexmo

app.post(
  "/nexmo",
  wrap(async (req, res) => {
    try {
      const messageId = await nexmo.handleIncomingMessage(req.body);
      res.send(messageId);
    } catch (ex) {
      log.error(ex);
      res.send("done");
    }
  })
);
*/

/*

TODO: Delete. We are not using nexmo

app.post(
  "/nexmo-message-report",
  wrap(async (req, res) => {
    try {
      const body = req.body;
      await nexmo.handleDeliveryReport(body);
    } catch (ex) {
      log.error(ex);
    }
    res.send("done");
  })
);
*/

app.post(
  "/twilio",
  twilio.webhook(),
  wrap(async (req, res) => {
    try {
      await twilio.handleIncomingMessage(req.body);
    } catch (ex) {
      log.error(ex);
    }

    const resp = new twiml.MessagingResponse();
    res.writeHead(200, { "Content-Type": "text/xml" });
    res.end(resp.toString());
  })
);

app.post(
  "/twilio-message-report",
  wrap(async (req, res) => {
    try {
      const body = req.body;
      await twilio.handleDeliveryReport(body);
    } catch (ex) {
      log.error(ex);
    }
    const resp = new twiml.MessagingResponse();
    res.writeHead(200, { "Content-Type": "text/xml" });
    res.end(resp.toString());
  })
);

app.get("/logout-callback", (req, res) => {
  req.logOut();
  res.redirect("/");
});

const loginCallbacks = passportSetup[
  process.env.PASSPORT_STRATEGY || global.PASSPORT_STRATEGY || "auth0"
](app);

if (loginCallbacks) {
  app.get("/login-callback", ...loginCallbacks.loginCallback);
  app.post("/login-callback", ...loginCallbacks.loginCallback);
}

const executableSchema = makeExecutableSchema({
  typeDefs: schema,
  resolvers,
  allowUndefinedInResolve: false
});
addMockFunctionsToSchema({
  schema: executableSchema,
  mocks,
  preserveResolvers: true
});

app.use(
  "/graphql",
  graphqlExpress(request => ({
    schema: executableSchema,
    debug: !!process.env.DEBUG_APOLLO,
    context: {
      loaders: createLoaders(),
      user: request.user,
      awsContext: request.awsContext || null,
      awsEvent: request.awsEvent || null,
      remainingMilliseconds: () =>
        request.awsContext && request.awsContext.getRemainingTimeInMillis
          ? request.awsContext.getRemainingTimeInMillis()
          : 5 * 60 * 1000 // default saying 5 min, no matter what
    },
    formatError: error => {
      telemetry.reportError(error.originalError, {
        userId: request.user && request.user.id,
        awsRequestId: request.awsContext
          ? request.awsContext.awsRequestId
          : undefined,
        awsEvent: request.awsEvent
      });
      return error;
    }
  }))
);
app.get(
  "/graphiql",
  graphiqlExpress({
    endpointURL: "/graphql"
  })
);

// This middleware should be last. Return the React app only if no other route is hit.
app.use(appRenderer);
app.use(telemetry.expressMiddleware);

if (port) {
  app.listen(port, () => {
    log.info(`Node app is running on port ${port}`);
  });
}

export default app;
