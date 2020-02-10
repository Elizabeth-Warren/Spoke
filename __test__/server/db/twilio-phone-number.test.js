import {
  setupTest,
  cleanupTest,
  setupCampaignFixture
} from "__test__/test_helpers";
import db from "src/server/db";
import faker from "faker";

beforeEach(async () => {
  await setupTest();
}, global.DATABASE_SETUP_TEARDOWN_TIMEOUT);

afterEach(async () => {
  await cleanupTest();
}, global.DATABASE_SETUP_TEARDOWN_TIMEOUT);

test("create and get a phone number", async () => {
  const createRes = await db.TwilioPhoneNumber.create({
    sid: "PN1234",
    phoneNumber: "6175653170",
    status: "AVAILABLE"
  });
  expect(createRes.rowCount).toEqual(1);

  const getRes = await db.TwilioPhoneNumber.get("PN1234");
  expect(getRes).toMatchObject({
    sid: "PN1234",
    areaCode: "617",
    phoneNumber: "+16175653170",
    status: "AVAILABLE"
  });
});

async function createPhones(areaCode, amount, extraFields) {
  for (let i = 0; i < amount; i++) {
    await db.TwilioPhoneNumber.create({
      sid: faker.random.uuid(),
      phoneNumber: faker.phone.phoneNumber(`+1${areaCode}#######`),
      status: "AVAILABLE",
      ...extraFields
    });
  }
}

function areaCodeCountsToObj(lst) {
  return lst.reduce((v, row) => ({ ...v, [row.areaCode]: row.count }), {});
}

test("countByAreaCode", async () => {
  await createPhones("805", 3);
  await createPhones("617", 2, { status: "ASSIGNED" });
  await createPhones("917", 5);
  const countAll = await db.TwilioPhoneNumber.countByAreaCode();
  expect(areaCodeCountsToObj(countAll)).toEqual({ 805: 3, 617: 2, 917: 5 });
  const countAssigned = await db.TwilioPhoneNumber.countByAreaCode({
    status: "ASSIGNED"
  });
  expect(areaCodeCountsToObj(countAssigned)).toEqual({ 617: 2 });
});

describe("phone number reservation and release", () => {
  let campaignId;
  beforeEach(async () => {
    campaignId = (await setupCampaignFixture()).campaign.id;
    await createPhones("808", 4);
    await createPhones("310", 1);
  });

  test("reserveForCampaign within limit", async () => {
    const success = await db.TwilioPhoneNumber.reserveForCampaign({
      campaignId,
      areaCode: "808",
      amount: 3
    });
    expect(success).toBeTruthy();
    const count = await db.TwilioPhoneNumber.countByAreaCode({
      campaignId,
      status: "RESERVED"
    });
    expect(count).toEqual([{ areaCode: "808", count: 3 }]);
  });

  test("reserveCampaign numbers exceeding limit", async () => {
    let failed;
    try {
      await db.TwilioPhoneNumber.reserveForCampaign({
        campaignId,
        areaCode: "808",
        amount: 7
      });
    } catch (e) {
      failed = true;
    }
    expect(failed).toBeTruthy();
    const count = await db.TwilioPhoneNumber.countByAreaCode({
      campaignId,
      status: "RESERVED"
    });
    expect(count).toEqual([]);
  });

  test("releaseAllCampaignNumbers", async () => {
    await db.TwilioPhoneNumber.reserveForCampaign({
      campaignId,
      areaCode: "808",
      amount: 3
    });
    await db.TwilioPhoneNumber.releaseAllCampaignNumbers(campaignId);
    const count = await db.TwilioPhoneNumber.countByAreaCode({ campaignId });
    expect(count).toEqual([]);
  });

  test("release and reserve success in a transaction", async () => {
    await db.TwilioPhoneNumber.reserveForCampaign({
      campaignId,
      areaCode: "808",
      amount: 2
    });
    const success = await db.transaction(async transaction => {
      await db.TwilioPhoneNumber.releaseAllCampaignNumbers(campaignId, {
        transaction
      });
      return await db.TwilioPhoneNumber.reserveForCampaign(
        { campaignId, areaCode: "310", amount: 1 },
        { transaction }
      );
    });
    expect(success).toBeTruthy();
    const count = await db.TwilioPhoneNumber.countByAreaCode({ campaignId });
    expect(count).toEqual([{ areaCode: "310", count: 1 }]);
  });

  test("release and reserve fail in a transaction", async () => {
    await db.TwilioPhoneNumber.reserveForCampaign({
      campaignId,
      areaCode: "808",
      amount: 2
    });

    let failed;
    try {
      await db.transaction(async transaction => {
        await db.TwilioPhoneNumber.releaseAllCampaignNumbers(campaignId, {
          transaction
        });
        await db.TwilioPhoneNumber.reserveForCampaign(
          { campaignId, areaCode: "310", amount: 17 },
          { transaction }
        );
      });
    } catch (e) {
      failed = true;
    }
    expect(failed).toBeTruthy();

    const count = await db.TwilioPhoneNumber.countByAreaCode({ campaignId });
    expect(count).toEqual([{ areaCode: "808", count: 2 }]);
  });
});
