import fs from "fs";
import path from "path";
import _ from "lodash";

import { r } from "src/server/models/";

// the site is not very useful without auth0, unless you have a session cookie already
// good for doing dev offline
const externalLinks = process.env.NO_EXTERNAL_LINKS
  ? ""
  : '<link rel="stylesheet" type="text/css" href="https://fonts.googleapis.com/css?family=Poppins">';

function getBundleFileName() {
  const assetMapData = JSON.parse(
    fs.readFileSync(
      // this is a bit overly complicated for the use case
      // of it being run from the build directory BY claudia.js
      // we need to make it REALLY relative, but not by the
      // starting process or the 'local' directory (which are both wrong then)
      (process.env.ASSETS_DIR || "").startsWith(".")
        ? path.join(
            __dirname,
            "../../../../",
            process.env.ASSETS_DIR,
            process.env.ASSETS_MAP_FILE
          )
        : path.join(process.env.ASSETS_DIR, process.env.ASSETS_MAP_FILE)
    )
  );

  return assetMapData["bundle.js"];
}

export async function updateBundleFileName() {
  // This is called by a Serverless hook once traffic shifting is complete after
  // a deploy and all users are using the new version. We update Redis so that
  // lambdas will start serving the new javascript.

  await r.redis.setAsync("spoke-bundle_file_name", getBundleFileName());
}

async function getBundleURL() {
  let bundleFileName;
  if (process.env.NODE_ENV === "production") {
    // Read bundle name from Redis
    const redisValue = await r.redis.getAsync("spoke-bundle_file_name");
    if (redisValue == null) {
      // no deploys have finished; no need to serve an old bundle
      bundleFileName = getBundleFileName();
    } else {
      bundleFileName = redisValue;
    }
  } else {
    bundleFileName = "/assets/bundle.js";
  }

  return `${process.env.ASSET_DOMAIN || ""}${bundleFileName}`;
}

export default async function renderIndex(req) {
  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"/>
    <title>Spoke</title>
    ${externalLinks}
    <style>
      /* CSS declarations go here */
      body {
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;

        padding: 0;
        margin: 0;
        height: 100%;
        font-size: 14px;
      }

      /**/
    </style>
    <style data-aphrodite></style>
  </head>
  <body>
    <div id="mount"></div>
    <script>
      window.INITIAL_STATE={};
      window.AUTH0_CLIENT_ID="${process.env.AUTH0_CLIENT_ID}"
      window.AUTH0_DOMAIN="${process.env.AUTH0_DOMAIN}"
      window.SUPPRESS_SELF_INVITE="${process.env.SUPPRESS_SELF_INVITE || ""}"
      window.NODE_ENV="${process.env.NODE_ENV}"
      window.PRIVACY_URL="${process.env.PRIVACY_URL || ""}"
      window.BASE_URL="${process.env.BASE_URL || ""}"
      window.NOT_IN_USA=${process.env.NOT_IN_USA || 0}
      window.ALLOW_SEND_ALL=${process.env.ALLOW_SEND_ALL || 0}
      window.BULK_SEND_CHUNK_SIZE=${process.env.BULK_SEND_CHUNK_SIZE || 0}
      window.MAX_MESSAGE_LENGTH=${process.env.MAX_MESSAGE_LENGTH || 1500}
      window.CONTACTS_PER_PHONE_NUMBER=${process.env
        .CONTACTS_PER_PHONE_NUMBER || 150}
      window.TERMS_REQUIRE="${process.env.TERMS_REQUIRE || ""}"
      window.TZ="${process.env.TZ || ""}"
      window.DST_REFERENCE_TIMEZONE="${process.env.DST_REFERENCE_TIMEZONE ||
        "America/New_York"}"
      window.PASSPORT_STRATEGY="${process.env.PASSPORT_STRATEGY || ""}"
      window.PEOPLE_PAGE_CAMPAIGN_FILTER_SORT = "${process.env
        .PEOPLE_PAGE_CAMPAIGN_FILTER_SORT || ""}"
      window.PEOPLE_PAGE_ROW_SIZES="${process.env.PEOPLE_PAGE_ROW_SIZES || ""}"
      window.CONVERSATION_LIST_ROW_SIZES="${process.env
        .CONVERSATION_LIST_ROW_SIZES || ""}"
      window.EMBEDDED_SHIFTER_URL="${process.env.EMBEDDED_SHIFTER_URL || ""}"
      window.SUPPRESS_PHONE_VALIDATION="${process.env
        .SUPPRESS_PHONE_VALIDATION || ""}"
      window.ASSET_DOMAIN=${
        process.env.ASSET_DOMAIN
          ? JSON.stringify(`${process.env.ASSET_DOMAIN}/assets/`)
          : "undefined"
      }
      window.SENTRY_DSN="${process.env.SENTRY_DSN || ""}"
      window.GIT_COMMIT_SHORT="${process.env.GIT_COMMIT_SHORT || ""}"
      window.GIT_TAGS="${process.env.GIT_TAGS || ""}"
      window.USER_ID=${
        req.user && req.user.id ? JSON.stringify(req.user.id) : "null"
      }
      window.STAGE="${process.env.STAGE || "local"}"
    </script>
    <script src="${await getBundleURL()}" crossorigin="anonymous"></script>
  </body>
</html>
`;
}
