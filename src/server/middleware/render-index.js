// the site is not very useful without auth0, unless you have a session cookie already
// good for doing dev offline
const externalLinks = process.env.NO_EXTERNAL_LINKS
  ? ""
  : '<link rel="stylesheet" type="text/css" href="https://fonts.googleapis.com/css?family=Poppins">';

export default function renderIndex(html, css, assetMap, store) {
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
        font-family: 'Ringside Regular A';
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
    <style data-aphrodite>${css.content}</style>
  </head>
  <body>
    <div id="mount">${html}</div>
    <script>
      window.INITIAL_STATE=${JSON.stringify(store.getState())}
      window.RENDERED_CLASS_NAMES=${JSON.stringify(css.renderedClassNames)}
      window.AUTH0_CLIENT_ID="${process.env.AUTH0_CLIENT_ID}"
      window.AUTH0_DOMAIN="${process.env.AUTH0_DOMAIN}"
      window.SUPPRESS_SELF_INVITE="${process.env.SUPPRESS_SELF_INVITE || ""}"
      window.NODE_ENV="${process.env.NODE_ENV}"
      window.PRIVACY_URL="${process.env.PRIVACY_URL || ""}"
      window.BASE_URL="${process.env.BASE_URL || ""}"
      window.NOT_IN_USA=${process.env.NOT_IN_USA || 0}
      window.ALLOW_SEND_ALL=${process.env.ALLOW_SEND_ALL || 0}
      window.BULK_SEND_CHUNK_SIZE=${process.env.BULK_SEND_CHUNK_SIZE || 0}
      window.MAX_MESSAGE_LENGTH=${process.env.MAX_MESSAGE_LENGTH || 99999}
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
    </script>
    <script src="${assetMap["bundle.js"]}"></script>
  </body>
</html>
`;
}
