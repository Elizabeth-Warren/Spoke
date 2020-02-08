import passport from "passport";
import Auth0Strategy from "passport-auth0";
import { Strategy as LocalStrategy } from "passport-local";
import SlackStrategy from "./vendor/passport-slack-strategy";
import { User, cacheableData } from "./models";
import localAuthHelpers from "./local-auth-helpers";
import wrap from "./wrap";
import { capitalizeWord } from "./api/lib/utils";
import log from "src/server/log";

export function setupAuth0Passport() {
  const strategy = new Auth0Strategy(
    {
      domain: process.env.AUTH0_DOMAIN,
      clientID: process.env.AUTH0_CLIENT_ID,
      clientSecret: process.env.AUTH0_CLIENT_SECRET,
      callbackURL: `${process.env.BASE_URL}/login-callback`
    },
    (accessToken, refreshToken, extraParams, profile, done) =>
      done(null, profile)
  );

  passport.use(strategy);

  passport.serializeUser((user, done) => {
    // This is the Auth0 user object, not the db one
    // eslint-disable-next-line no-underscore-dangle
    const auth0Id = user.id || user._json.sub;
    done(null, auth0Id);
  });

  passport.deserializeUser(
    wrap(async (id, done) => {
      // add new cacheable query
      const user = await cacheableData.user.userLoggedIn("auth0_id", id);
      done(null, user || false);
    })
  );

  return {
    loginCallback: [
      passport.authenticate("auth0", { failureRedirect: "/login" }),
      wrap(async (req, res) => {
        // eslint-disable-next-line no-underscore-dangle
        const auth0Id = req.user && (req.user.id || req.user._json.sub);
        if (!auth0Id) {
          throw new Error("Null user in login callback");
        }
        const existingUser = await User.filter({ auth0_id: auth0Id });

        if (existingUser.length === 0) {
          const userMetadata =
            // eslint-disable-next-line no-underscore-dangle
            req.user._json["https://spoke/user_metadata"] ||
            // eslint-disable-next-line no-underscore-dangle
            req.user._json.user_metadata ||
            {};

          const userData = {
            auth0_id: auth0Id,
            // eslint-disable-next-line no-underscore-dangle
            first_name: capitalizeWord(userMetadata.given_name) || "",
            // eslint-disable-next-line no-underscore-dangle
            last_name: capitalizeWord(userMetadata.family_name) || "",
            cell: userMetadata.cell || "",
            // eslint-disable-next-line no-underscore-dangle
            email: req.user._json.email,
            is_superadmin: false
          };

          await User.save(userData);

          res.redirect(req.query.state || "terms");
          return;
        }
        res.redirect(req.query.state || "/");
        return;
      })
    ]
  };
}

export function setupLocalAuthPassport() {
  const strategy = new LocalStrategy(
    {
      usernameField: "email",
      passReqToCallback: true
    },
    wrap(async (req, username, password, done) => {
      const lowerCaseEmail = username.toLowerCase();
      const existingUser = await User.filter({ email: lowerCaseEmail });
      const nextUrl = req.body.nextUrl || "";
      const uuidMatch = nextUrl.match(/\w{8}-(\w{4}\-){3}\w{12}/);

      // Run login, signup, or reset functions based on request data
      if (req.body.authType && !localAuthHelpers[req.body.authType]) {
        return done(null, false);
      }
      try {
        const user = await localAuthHelpers[req.body.authType]({
          lowerCaseEmail,
          password,
          existingUser,
          nextUrl,
          uuidMatch,
          reqBody: req.body
        });
        return done(null, user);
      } catch (err) {
        return done(null, false, err.message);
      }
    })
  );

  passport.use(strategy);

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(
    wrap(async (id, done) => {
      const intId = parseInt(id, 10);
      if (Number.isNaN(intId)) {
        done(null, false);
        return;
      }

      const user = await cacheableData.user.userLoggedIn(
        "id",
        parseInt(id, 10)
      );
      done(null, user || false);
    })
  );

  return {
    loginCallback: [
      passport.authenticate("local"),
      (req, res) => {
        res.redirect(req.body.nextUrl || "/");
      }
    ]
  };
}

function slackLoginId(teamId, userId) {
  return ["slack", teamId, userId].join("|");
}

export function setupSlackPassport(app) {
  passport.use(
    new SlackStrategy(
      {
        clientID: process.env.SLACK_CLIENT_ID,
        clientSecret: process.env.SLACK_CLIENT_SECRET,
        callbackURL: `${process.env.BASE_URL}/login-callback`
      },
      function(
        accessToken,
        scopes,
        team,
        { bot, incomingWebhook },
        { user: userProfile, team: teamProfile },
        done
      ) {
        done(null, {
          ...userProfile,
          team: teamProfile
        });
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, slackLoginId(user.team.id, user.id));
  });

  passport.deserializeUser(
    wrap(async (id, done) => {
      const [loginType, teamId, userId] = id.split("|");

      if (loginType !== "slack") {
        log.error(`Invalid loginType in session token: ${loginType}`);
        done(null, false);
        return;
      }

      if (teamId !== process.env.SLACK_TEAM_ID) {
        log.error(`Invalid team ID in session token: ${teamId}`);
        done(null, false);
        return;
      }

      // add new cacheable query
      const user = await cacheableData.user.userLoggedIn(
        "auth0_id",
        slackLoginId(teamId, userId)
      );
      done(null, user || false);
    })
  );

  app.get("/login/slack-redirect", (req, res) => {
    passport.authenticate("slack", {
      scope: ["identity.basic", "identity.email", "identity.team"],
      team: process.env.SLACK_TEAM_ID,
      state: req.query.nextUrl
    })(req, res);
  });

  return {
    loginCallback: [
      passport.authenticate("slack", { failureRedirect: "/login" }),
      wrap(async (req, res) => {
        // eslint-disable-next-line no-underscore-dangle
        const slackUser = req.user;

        // This might not be strictly neccesary -- if you try to sign in
        // with a different team, Slack will error and not redirect you
        // back becuase the OAuth app hasn't been configured for that
        // other team. But we do it anyway just in case there's some way
        // to get Slack to authenticate you against another team or if
        // someone accidentally publishes our Slack OAuth app as a
        // public app.
        if (slackUser.team.id !== process.env.SLACK_TEAM_ID) {
          res.send("You must log in using the Dream Big Fight Hard slack");
          return;
        }

        // eslint-disable-next-line no-underscore-dangle
        const loginId = slackLoginId(slackUser.team.id, slackUser.id);
        const existingUser = await User.filter({ auth0_id: loginId });

        if (existingUser.length === 0) {
          const userData = {
            auth0_id: loginId,
            // eslint-disable-next-line no-underscore-dangle
            first_name: slackUser.name.split(" ")[0],
            // eslint-disable-next-line no-underscore-dangle
            last_name: slackUser.name
              .split(" ")
              .slice(1)
              .join(" "),
            cell: "",
            email: slackUser.email,
            is_superadmin: false
          };
          await User.save(userData);
        }

        res.redirect(req.query.state || "/");
        return;
      })
    ]
  };
}

export default {
  local: setupLocalAuthPassport,
  auth0: setupAuth0Passport,
  slack: setupSlackPassport
};
