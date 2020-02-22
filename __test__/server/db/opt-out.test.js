import db from "src/server/db";
import {
  setupTest,
  cleanupTest,
  createUser,
  createOrganization,
  createCampaign,
  createContact,
  createScript,
  assignTexter,
  startCampaign
} from "__test__/test_helpers";
import { r } from "src/server/models";
import config from "src/server/config";

let fixture1;
let fixture2;
let testAdminUser;

beforeEach(async () => {
  await setupTest();
  testAdminUser = await createUser();
  [fixture1, fixture2] = await Promise.all(
    [1, 2].map(async () => {
      const org = await createOrganization(testAdminUser);
      const campaign = await createCampaign(testAdminUser, org);
      // note: because these fixtures are so simple, both contacts have the same phone,
      // which is what we want for this test.
      const contact = await createContact(campaign);
      await assignTexter(testAdminUser, campaign);
      await createScript(testAdminUser, campaign);
      await startCampaign(testAdminUser, campaign);
      return {
        contact,
        orgId: org.data.createOrganization.id,
        campaignId: campaign.id
      };
    })
  );
}, global.DATABASE_SETUP_TEARDOWN_TIMEOUT);

afterEach(async () => {
  await cleanupTest();
}, global.DATABASE_SETUP_TEARDOWN_TIMEOUT);

async function optOutContactInOrg1() {
  const assignment = await r
    .knex("assignment")
    .where("user_id", testAdminUser.id)
    .where("campaign_id", fixture1.campaignId)
    .select("id")
    .first();
  await db.OptOut.create({
    cell: fixture1.contact.cell,
    organization_id: fixture1.orgId,
    assignment_id: assignment.id
  });
}

async function isOptedOut(fixture) {
  return await db.OptOut.isOptedOut({
    cell: fixture.contact.cell,
    organization_id: fixture.orgId
  });
}

describe("opt outs synced from external sources", () => {
  test("are respected", async () => {
    await db.OptOut.create({
      cell: fixture1.contact.cell,
      organization_id: fixture1.orgId
      // missing assignment_id
    });
    expect(await isOptedOut(fixture1)).toBeTruthy();
  });
});

describe("with OPTOUTS_SHARE_ALL_ORGS turned on", () => {
  const previousValue = config.OPTOUTS_SHARE_ALL_ORGS;
  beforeAll(() => (config.OPTOUTS_SHARE_ALL_ORGS = true));
  afterAll(() => (config.OPTOUTS_SHARE_ALL_ORGS = previousValue));

  test("db.OptOuts", async () => {
    expect(await isOptedOut(fixture1)).toBeFalsy();
    expect(await isOptedOut(fixture2)).toBeFalsy();

    await optOutContactInOrg1();

    expect(await isOptedOut(fixture1)).toBeTruthy();
    expect(await isOptedOut(fixture2)).toBeTruthy();
  });
});

describe("with OPTOUTS_SHARE_ALL_ORGS turned off", () => {
  const previousValue = config.OPTOUTS_SHARE_ALL_ORGS;
  beforeAll(() => (config.OPTOUTS_SHARE_ALL_ORGS = false));
  afterAll(() => (config.OPTOUTS_SHARE_ALL_ORGS = previousValue));

  test("db.OptOuts", async () => {
    expect(await isOptedOut(fixture1)).toBeFalsy();
    expect(await isOptedOut(fixture2)).toBeFalsy();

    await optOutContactInOrg1();

    expect(await isOptedOut(fixture1)).toBeTruthy();
    expect(await isOptedOut(fixture2)).toBeFalsy();
  });
});
