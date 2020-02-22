# WARREN INTERNAL SPOKE

This is Team Warren's internal fork of Spoke based off of the [staging_20191102](https://github.com/WorkingFamilies/Spoke/tree/staging_20191102)
branch of the Working Families Party's fork of MoveOn's Spoke.

_Note: We want to contribute our changes upstream. Assume this repo will be made public and commit accordingly._

Notable changes from upstream:

- Removed support for Nexmo
- Removed support for Mailgun and custom SMTP servers in favor of SES
- Removed and renamed some env vars, notable TWILIO_API_KEY -> TWILIO_ACCOUNT_SID
- Removed asynchronous processing of Twilio responses
- Removed opt-out caching, which was incomplete in this fork
- Added support for using a different Twilio Messaging Service for each campaign
- Added external_id_type and state_code as top-level fields to campaign_contact
- Removed support for `zip` on campaign_contact, which was incomplete in WFP fork anyway
- Removed support for sqlite
- Reworked background jobs to run on Lambda, removed support for cron'd jobs
- Added slack log in
- Changed the invite flow
- Split the texter experience into separate components for initial sends and replies
- Removed bulk send
- Phone number management (see below)
- Reworked dynamic assignment experience, removed support for static assignment

## Running for the first time

Run `docker-compose up` to start the db.

Then, run `yarn run dev-migrate` and `yarn run create-test-db`

`./dev-tools/manage-messaging-services.js --command create --friendlyName <your test messaging service name> " --baseUrl <your ngrok url>`

`./dev-tools/buy-numbers.js --areaCode <any area code> --messagingServiceSid <your TWILIO_MESSAGE_SERVICE_SID> --limit 1`

### Running Locally

Open two terminal windows:

1. `docker-compose up`
2. `yarn run dev`

### Updating ngrok url for messaging service

`./dev-tools/manage-messaging-services.js --command update --baseUrl <YOUR_NGROK_URL> --sid <TWILIO_MESSAGE_SERVICE_SID>`

/ begin original README

## Testing with auto-responders

If you'd like to test spoke without actually sending texts, you have a couple options.

### Skipping Twilio

We have an option to skip sending texts through Twilio and just simulating replies. In your .env, add the following two lines:

```
# This makes Spoke not send any real texts and just simulate a reply coming back
SKIP_TWILIO_AND_AUTOREPLY=1

# This makes Spoke randomly drop 60% of messages (so only ~40% of contacts will respond). This is based on
# a hash of the contact's phone number, so a particular contact will have a 60% chance of responding to
# the initial text, and then if they do respond they will continue to respond to future messages.
DROP_MESSAGE_RATIO=0.6
```

### Twilio Autoresponder

If you're working with the Twilio code itself, you may want to actually keep Twilio in the loop and
send real texts. To do this, replace `SKIP_TWILIO_AND_AUTOREPLY=1` with `OVERRIDE_RECIPIENT=+16173974753`.
This will send all texts, regardless of the contact's phone number, to `+16173974753`. This is a special
Twilio number that will auto-reply with whatever you sent it (try it out by sending a text to that number!)

We have some special handling in the code to still route texts correctly -- we append the contact's original
phone number to the outgoing message (so `foo` sent to `+16175555770` would become `[+16175555770] foo`), and
then the autoreply will keep that intact (so it would reply with `[+16175555770] foo (auto-reply)`). We then
parse out this tag in incoming messages and treat that message as a reply from `+16175555770`.

IMPORTANT NOTE: Twilio will block messages after 15 in a row go back and forth between two numbers
within 15 seconds. So if you use this setting to send more than 7 outbound messages, you'll
hit this limit and Twilio will stop sending messages. So the recommended flow is to switch
to this config just to do a small end-to-end test with a couple recipients (and probably
change DROP_MESSAGE_RATIO to 0 so you actually send all the messages).

### Generating test input data

To generate a CSV with, e.g., 1000 contacts, just run:

```
./dev-tools/generate-test-data.py 1000 > ./sample1000.csv
```

This will generate 1000 contacts with `555`-area-code phone numbers, black-hole email addresses,
`02141` as their ZIP, and a `fav_color` custom field.

In your .env, add the following to make phone numbers valid from the sample input data

```
SUPPRESS_PHONE_VALIDATION=1
```

### Working with a reasonable batch size for dynamic assign

The default size for batch assign is 300, but when testing you can change the batch size to a more reasonable tested number by setting in the .env file.

```
DYNAMIC_ASSIGN_MAX_BATCH_SIZE=10
```

### Phone number provisioning

There are two ways to provision Twilio phone numbers and Messaging Services in the Warren fork of Spoke:

- Using the `campaignPhoneNumbers` feature, which provisions Messaging Services for
  campaigns on-the-fly and adds numbers from a shared inventory. This feature allows
  Spoke to scale beyond the limits of a single Messaging Service (400 numbers or about
  80,000 texts a day). Numbers and Messaging Services are managed by the application.

- Using the global Messaging Service set by the TWILIO_MESSAGE_SERVICE_SID env var.
  We also support setting a message_service_sid in organization features, but this is
  not used currently and may be removed in the future. The messaging service needs to
  be created and managed manually. See `dev-tools/` for scripts to help with this.

The rest of this section describes `campaignPhoneNumbers` feature.

#### Enabling `campaignPhoneNumbers`

You must be an OWNER of an organization to enable the `campaignPhoneNumbers`.
There is no UI for this but it can be done through a mutation in Graphiql:

```
mutation {
  enableCampaignPhoneNumbers(organizationId: "12345") {
    campaignPhoneNumbersEnabled
  }
}
```

#### The phone number inventory

`campaignPhoneNumbers` relies on an inventory of phone numbers managed by the Spoke application.
Managed phone numbers are tracked in the `twilio_phone_number` table and can be in one
of three states:

- `AVAILABLE`: available to be claimed by a new campaign
- `RESERVED`: claimed by an unstarted campaign. Reservations expire to prevent
  campaigns from holding numbers without using them.
- `ASSIGNED`: claimed by an active campaign and added to the Twilio Messaging Service
  created for that campaign.

The phone number inventory is shared by all organizations in a Spoke instance. This was
desirable for Warren for President but might not be suitable for all Spoke deployments.

#### Campaign creation

When the `campaignPhoneNumbers` feature is enabled, admins will have to configure
phone numbers when building a campaign. The "Phone Numbers" section in the
campaign creation flow allows admins to select the area codes they want to use from
the list of available phone numbers in the inventory.

This also enforces a ratio of 150 contacts per number to stay well within the
recommended limit of 200 texts/day for P2P texting. A campaign cannot start until enough
numbers have been reserved.

By design, an admin cannot purchase numbers or make modifications to Twilio while
editing a draft campaign. Starting a campaign creates a Messaging Service and
transfers already-purchased numbers to it. Once a campaign is started, the Messaging
Service and phone number configuration cannot be changed.

#### Purchasing numbers for the inventory

To buy more numbers and make them available to campaign creators, SUPERADMINS can
run a mutation in Graphiql.

Example: purchase 3 numbers in the 952 area code:

```
mutation {
  buyNumbers(areaCode: "952", limit: 3) {
    id
  }
}
```

_IMPORTANT: the `twilio_phone_numbers` table and buy-numbers background job are not
intended to be used with the global Twilio messaging service. Instead, use
`dev-tools/buy-numbers.js` to buy numbers if you don't have `campaignPhoneNumbers`
turned on._

#### Voice responses

To override the default voice response for Spoke-managed numbers set the TWILIO_VOICE_URL
env var. We use a simple TwiML Bin response:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>https://ew-spoke-public.s3.amazonaws.com/2020-01-12_DTC_Text+Incoming+Message.wav</Play>
</Response>
```

#### Sticky sender

The `campaignPhoneNumbers` feature was designed to avoid texting contacts with the same number from
different campaigns. This solves two problems:

1. It avoids threading messages from different campaigns/volunteers on the contact's phone
2. It allows us to route texts correctly for contacts who receive messages from more
   than one campaign. By comparison, Spoke will route incoming messages to the campaign
   that texted a contact most recently when using a shared Messaging Service.

Note that phone numbers are re-used, so it is possible for a contact to receive messages
from the same number from different campaigns, though it is unlikely at scale.
It is not possible, however, for a number to be used by two active campaigns simultaneously,
so we still manage to avoid routing problems.

# Spoke

Spoke is an open source text-distribution tool for organizations to mobilize supporters and members into action. Spoke allows you to upload phone numbers, customize scripts and assign volunteers to communicate with supporters while allowing organizations to manage the process.

Spoke was created by Saikat Chakrabarti and Sheena Pakanati, and is now maintained by MoveOn.org.

The latest version is [2.0.0](https://github.com/MoveOnOrg/Spoke/tree/v2.0) (see [release notes](https://github.com/MoveOnOrg/Spoke/blob/main/docs/RELEASE_NOTES.md#v20)) which we recommend for production use, while our `main` branch is where features still in development and testing will be available.

## Deploy to Heroku

<a href="https://heroku.com/deploy?template=https://github.com/MoveOnOrg/Spoke/tree/v2.0">
  <img src="https://www.herokucdn.com/deploy/button.svg" alt="Deploy">
</a>

Follow up instructions located [here](https://github.com/MoveOnOrg/Spoke/blob/main/docs/HOWTO_HEROKU_DEPLOY.md)

Please let us know if you deployed by filling out this form [here](https://act.moveon.org/survey/tech/)

## Getting started

1. Install either sqlite (or another [knex](http://knexjs.org/#Installation-client)-supported database)
2. Install the Node version listed in `.nvmrc`. [NVM](https://github.com/creationix/nvm) is one way to do this (from the spoke directory):
   ```
   nvm install
   nvm use
   ```
3. `yarn install` (If yarn is not yet installed, run `npm install -g yarn` first)
4. `cp .env.example .env`
5. If you want to use Postgres:
   - In `.env` set `DB_TYPE=pg`. (Otherwise, you will use sqlite.)
   - Set `DB_PORT=5432`, which is the default port for Postgres.
   - Create the spokedev database: `psql -c "create database spokedev;"`
6. Some other settings to tweak in dev -- make sure you are NOT editing .env.example -- edit `.env`:

   - For development, you should probably set `DEFAULT_SERVICE=fakeservice` to skip using an SMS provider (Twilio or Nexmo) and insert the message directly into the database.
   - For production, you'll want to use Auth0 for login and set PASSPORT_STRATEGY=auth0 -- see [Auth0 for authentication](https://github.com/MoveOnOrg/Spoke/blob/main/docs/HOWTO-configure-auth0.md) for setup instructions

7. Run `yarn dev` to start the app. Wait until you see both "Node app is running ..." and "webpack: Compiled successfully." before attempting to connect. (make sure environment variable `JOBS_SAME_PROCESS=1`)
8. Go to `http://localhost:3000` to load the app and create the database (Note: the terminal will say it's running on port 8090 -- don't believe it :-) -- it's running a proxy on port 3000 which also includes static asset serving, etc.
9. As long as you leave `SUPPRESS_SELF_INVITE=` blank and unset in your `.env` you should be able to invite yourself from the homepage.

   - If you DO set that variable, then spoke will be invite-only and you'll need to generate an invite. Run:
     ```
     echo "INSERT INTO invite (hash,is_valid) VALUES ('abc', 1);" |sqlite3 mydb.sqlite
     # Note: When doing this with PostgreSQL, you would replace the `1` with `true`
     ```
   - Then use the generated key to visit an invite link, e.g.: http://localhost:3000/invite/abc. This should redirect you to the login screen. Use the "Sign Up" option to create your account.

10. You should then be prompted to create an organization. Create it.
11. See the [Admin and Texter demos](https://opensource.moveon.org/spoke-p2p#block-yui_3_17_2_25_1509554076500_36334) to learn about how Spoke works.
12. See [Getting Started with Development](#more-documentation) below.

### SMS

For development, you can set `DEFAULT_SERVICE=fakeservice` to skip using an SMS provider (Twilio or Nexmo) and insert the message directly into the database.

To simulate receiving a reply from a contact you can use the Send Replies utility: `http://localhost:3000/admin/1/campaigns/1/send-replies`, updating the app and campaign IDs as necessary. You can also include "autorespond" in the script message text, and an automatic reply will be generated (just for `fakeservice`!)

**Twilio**

Twilio provides [test credentials](https://www.twilio.com/docs/iam/test-credentials) that will not charge your account as described in their documentation. To setup Twilio follow our [Twilio setup guide](https://github.com/MoveOnOrg/Spoke/blob/main/docs/HOWTO_INTEGRATE_TWILIO.md).

## Getting started with Docker

Docker is optional, but can help with a consistent development environment using postgres.

1. `cp .env.example .env` and see step 6 above for some possible tweaks
2. Build and run Spoke with `docker-compose up --build`
   - You can stop docker compose at any time with `CTRL+C`, and data will persist next time you run `docker-compose up`.
3. Go to [localhost:3000](http://localhost:3000) to load the app.
   - But if you need to generate an invite, run:
     ```bash
     docker-compose exec postgres psql -U spoke -d spokedev -c "INSERT INTO invite (hash,is_valid) VALUES ('<your-hash>', true);"
     ```
   - Then use the generated key to visit an invite link, e.g.: `http://localhost:3000/invite/<your-hash>`. This should redirect you to the login screen. Use the "Sign Up" option to create your account.
4. You should then be prompted to create an organization. Create it.
5. When done testing, clean up resources with `docker-compose down`, or `docker-compose down -v` to **_completely destroy_** your Postgres database & Redis datastore volumes.

## More Documentation

- Getting Started with Development:
  - Welcome! Start with [CONTRIBUTING.md](./CONTRIBUTING.md) for community participation and engagement details.
  - [Development Guidelines and Tips](https://github.com/MoveOnOrg/Spoke/blob/main/docs/EXPLANATION-development-guidelines.md)
  - [Running Tests](https://github.com/MoveOnOrg/Spoke/blob/main/docs/HOWTO-run_tests.md)
- More Development documentation

  - [A request example](https://github.com/MoveOnOrg/Spoke/blob/main/docs/EXPLANATION-request-example.md) pointing to different code points that all connect to it.
  - [GraphQL Debugging](https://github.com/MoveOnOrg/Spoke/blob/main/docs/graphql-debug.md)
  - [Environment Variable Reference](https://github.com/MoveOnOrg/Spoke/blob/main/docs/REFERENCE-environment_variables.md)
  - [QA Guide](https://github.com/MoveOnOrg/Spoke/blob/main/docs/QA_GUIDE.md)

- Deploying

  - [Deploying with Heroku](https://github.com/MoveOnOrg/Spoke/blob/main/docs/HOWTO_HEROKU_DEPLOY.md) (and see Heroku deploy button above)
  - [Deploying on AWS Lambda](https://github.com/MoveOnOrg/Spoke/blob/main/docs/DEPLOYING_AWS_LAMBDA.md)
  - We recommend using [Auth0 for authentication](https://github.com/MoveOnOrg/Spoke/blob/main/docs/HOWTO-configure-auth0.md) in deployed environments (Heroku docs have their own instructions)
  - [How to setup Twilio](https://github.com/MoveOnOrg/Spoke/blob/main/docs/HOWTO_INTEGRATE_TWILIO.md)
  - [Configuring Email](https://github.com/MoveOnOrg/Spoke/blob/main/docs/EMAIL_CONFIGURATION.md)
  - [Configuring Data Exports](https://github.com/MoveOnOrg/Spoke/blob/main/docs/DATA_EXPORTING.md) works
  - [Using Redis for Caching](https://github.com/MoveOnOrg/Spoke/blob/main/docs/HOWTO_CONNECT_WITH_REDIS.md) to improve server performance
  - Configuration for [Enforcing Texting Hours](https://github.com/MoveOnOrg/Spoke/blob/main/docs/TEXTING-HOURS-ENFORCEMENT.md)

- Integrations

  - [ActionKit](https://github.com/MoveOnOrg/Spoke/blob/main/docs/HOWTO_INTEGRATE_WITH_ACTIONKIT.md)

- Administration
  - Description of the different [Roles and Their Permissions](https://github.com/MoveOnOrg/Spoke/blob/main/docs/ROLES_DESCRIPTION.md)
  - Some DB queries for [Texter Activity](https://github.com/MoveOnOrg/Spoke/blob/main/docs/TEXTER_ACTIVITY_QUERIES.md)

## Deploying Minimally

There are several ways to deploy documented below. This is the 'most minimal' approach:

1. Run `OUTPUT_DIR=./build yarn run prod-build-server`
   This will generate something you can deploy to production in ./build and run nodejs server/server/index.js
2. Run `yarn run prod-build-client`
3. Make a copy of `deploy/spoke-pm2.config.js.template`, e.g. `spoke-pm2.config.js`, add missing environment variables, and run it with [pm2](https://www.npmjs.com/package/pm2), e.g. `pm2 start spoke-pm2.config.js --env production`
4. [Install PostgreSQL](https://wiki.postgresql.org/wiki/Detailed_installation_guides)
5. Start PostgreSQL (e.g. `sudo /etc/init.d/postgresql start`), connect (e.g. `sudo -u postgres psql`), create a user and database (e.g. `create user spoke password 'spoke'; create database spoke owner spoke;`), disconnect (e.g. `\q`) and add credentials to `DB_` variables in spoke-pm2.config.js

## Big Thanks

Cross-browser Testing Platform and Open Source <3 Provided by [Sauce Labs](https://saucelabs.com).

# License

Spoke is licensed under the MIT license.
