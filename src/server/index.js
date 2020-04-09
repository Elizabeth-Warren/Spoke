import "@babel/polyfill";
import bodyParser from "body-parser";
import express from "express";
import { graphqlExpress, graphiqlExpress } from "apollo-server-express";
import { makeExecutableSchema, addMockFunctionsToSchema } from "graphql-tools";
import sourceMapSupport from "source-map-support";
import passport from "passport";
import cookieSession from "cookie-session";
import db from "src/server/db";
import { createLoaders } from "src/server/data-loaders";
import { resolvers } from "src/server/api/schema";
import { schema } from "src/api/schema";
import mocks from "src/server/api/mocks";
import passportSetup from "src/server/auth-passport";
import wrap from "src/server/wrap";
import log from "src/server/log";
import twilio from "src/server/api/lib/twilio";
import { twiml } from "twilio";
import { existsSync } from "fs";
import telemetry from "src/server/telemetry";
import renderIndex from "src/server/middleware/render-index";
import responseTimeMiddleware from "src/server/middleware/graphql-response-time";

const TELEMETRY_IGNORED_ERROR_CODES = [
  "FORBIDDEN",
  "NOT_FOUND",
  "SUSPENDED",
  "UNAUTHORIZED",
  "CAMPAIGN_ARCHIVED",
  "CAMPAIGN_FULL",
  "DUPLICATE_REPLY_MESSAGE",
  "DUPLICATE_MESSAGE",
  "TEXTING_HOURS",
  "CAMPAIGN_CLOSED",
  "CAMPAIGN_CLOSED_FOR_INITIAL_SENDS"
];

db.enableTracing();

// Support source maps in stack traces
sourceMapSupport.install();

process.on("uncaughtException", ex => {
  log.error(ex);
  process.exit(1);
});

const DEBUG = process.env.NODE_ENV === "development";

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
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
      sameSite: "lax"
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

if (process.env.SIMULATE_DELAY_MILLIS) {
  app.use((req, res, next) => {
    setTimeout(next, Number(process.env.SIMULATE_DELAY_MILLIS));
  });
}

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
  responseTimeMiddleware,
  graphqlExpress(request => {
    // if (Math.random() > 0.3) {
    //   throw new Error("test error");
    // } else {
    //   console.log("NO ERROR");
    // }
    return {
      schema: executableSchema,
      debug: !!process.env.DEBUG_APOLLO,
      context: {
        // TODO[matteo]: add request logger
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
        let code = "UNKNOWN";
        if (error.originalError) {
          code = error.originalError.code || "INTERNAL_SERVER_ERROR";
        }
        error.code = code;
        log.error({
          userId: request.user && request.user.id,
          error,
          msg: "GraphQL error"
        });

        if (TELEMETRY_IGNORED_ERROR_CODES.indexOf(error.code) === -1) {
          telemetry.reportError(error.originalError || error, {
            userId: request.user && request.user.id,
            code,
            awsRequestId: request.awsContext
              ? request.awsContext.awsRequestId
              : undefined,
            awsEvent: request.awsEvent,
            path: JSON.stringify(error.path)
          });
        }
        return error;
      }
    };
  })
);

app.get(
  "/graphiql",
  graphiqlExpress({
    endpointURL: "/graphql"
  })
);

const nonLoginPaths = new Set(["/", "/login", "/404"]);

// This middleware should be last. Return the React app only if no other route is hit.
app.use(async (req, res, next) => {
  if (!nonLoginPaths.has(req.path) && !req.isAuthenticated()) {
    res.redirect(302, `/login?nextUrl=${encodeURIComponent(req.path)}`);
    return;
  }

  res.type("html");

  try {
    res.send(await renderIndex(req));
  } catch (e) {
    next(e);
  }
});

app.use(telemetry.expressMiddleware);

if (port) {
  const server = app.listen(port, () => {
    log.info(`Node app is running on port ${port}`);
  });

  // Handle nodemon shutdown cleanly, otherwise the port might not
  // be freed before we start up again.
  process.once("SIGUSR2", () => {
    log.warn("Got SIGUSR2, shutting down...");
    server.close(() => {
      log.warn("Server shut down, exiting.");
      process.exit();
    });
  });
}

export default app;
