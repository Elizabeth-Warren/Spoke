/* eslint-disable no-unused-expressions, consistent-return */
import { r } from "../../src/server/models/";
import {
  runGql,
  setupTest,
  cleanupTest,
  getGql,
  createUser,
  createOrganization,
  createCampaign,
  createContact,
  createTexter,
  assignTexter,
  createScript,
  startCampaign,
  getCampaignContact
} from "../test_helpers";
import waitForExpect from "wait-for-expect";

let testAdminUser;
let testOrganization;
let testCampaign;
let testTexterUser;
let testContact;
let assignmentId;
let organizationId;

beforeEach(async () => {
  // Set up an entire working campaign
  await setupTest();
  testAdminUser = await createUser();
  testOrganization = await createOrganization(testAdminUser);
  testCampaign = await createCampaign(testAdminUser, testOrganization);
  testContact = await createContact(testCampaign);
  testTexterUser = await createTexter(testOrganization, testAdminUser);
  await assignTexter(testAdminUser, testTexterUser, testCampaign);
  const dbCampaignContact = await getCampaignContact(testContact.id);
  assignmentId = dbCampaignContact.assignment_id;
  organizationId = testOrganization.data.createOrganization.id;
  await createScript(testAdminUser, testCampaign);
  await startCampaign(testAdminUser, testCampaign);
}, global.DATABASE_SETUP_TEARDOWN_TIMEOUT);

afterEach(async () => {
  await cleanupTest();
  if (r.redis) r.redis.flushdb();
}, global.DATABASE_SETUP_TEARDOWN_TIMEOUT);

// TODO[matteo]: fix these tests once we've decided what to do with the autoresponser
it.skip("should send an inital message to test contacts", async () => {
  const {
    query: [getContacts, getContactsVars],
    mutations
  } = getGql("../src/containers/TexterTodo", {
    messageStatus: "needsMessage",
    params: { organizationId, assignmentId }
  });

  const queryResult = await runGql(
    getContacts,
    getContactsVars,
    testTexterUser
  );

  const contact = queryResult.data.assignment.contacts[0];
  const message = {
    contactNumber: "5555555555",
    userId: testTexterUser.id,
    text: "test text",
    assignmentId
  };

  const [messageMutation, messageVars] = mutations.sendMessage(
    message,
    contact.id
  );

  const messageResult = await runGql(
    messageMutation,
    messageVars,
    testTexterUser
  );

  const campaignContact = messageResult.data.sendMessage;
  expect(campaignContact.messageStatus).toBe("messaged");

  const expectedDbMessage = {
    // user_id: testTexterUser.id, //FUTURE
    contact_number: testContact.cell,
    text: message.text,
    assignment_id: assignmentId
    // campaign_contact_id: testContact.id //FUTURE
  };

  // wait for fakeservice to mark the message as sent
  await waitForExpect(async () => {
    const dbMessage = await r.knex("message");
    expect(dbMessage.length).toEqual(1);
    expect(dbMessage[0]).toEqual(
      expect.objectContaining({
        send_status: "SENT",
        ...expectedDbMessage
      })
    );
    const dbCampaignContact = await getCampaignContact(testContact.id);
    expect(dbCampaignContact.message_status).toBe("messaged");
  });

  const ret2 = await runGql(getContacts, getContactsVars, testTexterUser);

  // Refetch the contacts via gql to check the caching
  expect(ret2.data.assignment.contacts[0].messageStatus).toEqual("messaged");
});

it.skip("should be able to receive a response and reply (using fakeService)", async () => {
  const {
    query: [getContacts, getContactsVars],
    mutations
  } = getGql("../src/containers/TexterTodo", {
    messageStatus: "needsMessage",
    params: { organizationId, assignmentId }
  });

  const queryResult = await runGql(
    getContacts,
    getContactsVars,
    testTexterUser
  );

  const contact = queryResult.data.assignment.contacts[0];

  const message = {
    contactNumber: contact.cell,
    userId: testTexterUser.id,
    text: "test text autorespond",
    assignmentId
  };

  const [messageMutation, messageVars] = await mutations.sendMessage(
    message,
    contact.id
  );

  await runGql(messageMutation, messageVars, testTexterUser);
  // wait for fakeservice to autorespond
  await waitForExpect(async () => {
    const dbMessage = await r.knex("message");
    console.log("DBMESSAGE", dbMessage);
    expect(dbMessage.length).toEqual(2);
    expect(dbMessage[1]).toEqual(
      expect.objectContaining({
        send_status: "DELIVERED",
        text: `responding to ${message.text}`,
        // user_id: testTexterUser.id, //FUTURE
        contact_number: testContact.cell,
        assignment_id: assignmentId
        // campaign_contact_id: testContact.id //FUTURE
      })
    );
  });

  await waitForExpect(async () => {
    const dbCampaignContact = await getCampaignContact(testContact.id);
    expect(dbCampaignContact.message_status).toBe("needsResponse");
  });

  // Refetch the contacts via gql to check the caching
  const ret2 = await runGql(getContacts, getContactsVars, testTexterUser);
  expect(ret2.queryResult.data.assignment.contacts[0].messageStatus).toEqual(
    "needsResponse"
  );

  // Then we reply
  const message2 = {
    contactNumber: contact.cell,
    userId: testTexterUser.id,
    text: "reply",
    assignmentId
  };

  const [replyMutation, replyVars] = mutations.sendMessage(
    message2,
    contact.id
  );

  await runGql(replyMutation, replyVars, testTexterUser);

  // wait for fakeservice to mark the message as sent
  await waitForExpect(async () => {
    const dbMessage = await r.knex("message");
    expect(dbMessage.length).toEqual(3);
    expect(dbMessage[2]).toEqual(
      expect.objectContaining({
        send_status: "SENT"
      })
    );
    const dbCampaignContact = await getCampaignContact(testContact.id);
    expect(dbCampaignContact.message_status).toBe("convo");
  });
  const ret3 = await runGql(getContacts, getContactsVars, testTexterUser);
  expect(ret3.queryResult.data.assignment.contacts[0].messageStatus).toEqual(
    "convo"
  );
});
