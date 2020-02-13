import { resolvers } from "../src/server/api/schema";
import { schema } from "../src/api/schema";
import { assignmentRequired } from "../src/server/api/errors";
import { graphql } from "graphql";
import {
  Assignment,
  Campaign,
  CampaignContact,
  Organization,
  User
} from "../src/server/models/";
import { resolvers as campaignResolvers } from "../src/server/api/campaign";
import { cleanupTest, getContext, setupTest } from "./test_helpers";
import { makeExecutableSchema } from "graphql-tools";
import faker from "faker";

const mySchema = makeExecutableSchema({
  typeDefs: schema,
  resolvers: resolvers,
  allowUndefinedInResolve: true
});

const rootValue = {};

// data items used across tests

let testAdminUser;
let testOrganization;
let testCampaign;
let testTexterUser;

// data creation functions

async function createUser(
  userInfo = {
    auth0_id: faker.random.uuid(),
    first_name: faker.name.firstName(),
    last_name: faker.name.lastName(),
    cell: faker.phone.phoneNumber(),
    email: faker.internet.email()
  }
) {
  const user = new User(userInfo);
  try {
    await user.save();
    console.log("created user");
    console.log(user);
    return user;
  } catch (err) {
    console.error("Error saving user");
    // return false;
  }
}

async function createContact(campaignId) {
  const contact = new CampaignContact({
    first_name: "Ann",
    last_name: "Lewis",
    cell: "5555555555",
    zip: "12345",
    campaign_id: campaignId
  });
  try {
    await contact.save();
    console.log("created contact");
    console.log(contact);
    return contact;
  } catch (err) {
    console.error("Error saving contact: ", err);
    return false;
  }
}

// TODO: use test helper
async function createOrganization(user, name) {
  const context = getContext({ user });
  const orgQuery = `mutation createOrganization($name: String!) {
    createOrganization(name: $name) {
      id
      uuid
      name
      threeClickEnabled
      textingHoursEnforced
      textingHoursStart
      textingHoursEnd
    }
  }`;

  const variables = { name };

  try {
    return await graphql(mySchema, orgQuery, rootValue, context, variables);
  } catch (err) {
    console.error("Error creating organization");
    return false;
  }
}

async function createCampaign(user, title, description, organizationId) {
  const context = getContext({ user });

  const campaignInstance = new Campaign({
    organization_id: organizationId,
    creator_id: user.id
  });

  await campaignInstance.save();

  const campaignQuery = `mutation editCampaign($id: String!, $input: CampaignInput!) {
    editCampaign(id: $id, campaign: $input) {
      id
      title
    }
  }`;
  const variables = {
    id: campaignInstance.id,
    input: {
      title,
      description,
      organizationId
    }
  };

  try {
    const campaign = await graphql(
      mySchema,
      campaignQuery,
      rootValue,
      context,
      variables
    );

    if (campaign.errors) {
      console.error(campaign.errors);
    }
    console.log(campaign);

    return campaign;
  } catch (err) {
    console.error("Error creating campaign");
    return false;
  }
}

// graphQL tests

beforeAll(
  async () => await setupTest(),
  global.DATABASE_SETUP_TEARDOWN_TIMEOUT
);
afterAll(
  async () => await cleanupTest(),
  global.DATABASE_SETUP_TEARDOWN_TIMEOUT
);

it("should be undefined when user not logged in", async () => {
  const query = `{
    currentUser {
      id
    }
  }`;
  const context = getContext();
  const data = await graphql(mySchema, query, rootValue, context);

  expect(typeof data.currentUser).toEqual("undefined");
});

// TODO: refactor this whole test suite so it doesn't have to run sequentially
// TESTING CAMPAIGN CREATION FROM END TO END
it("should return the current user when user is logged in", async () => {
  testAdminUser = await createUser();
  const query = `{
    currentUser {
      email
    }
  }`;
  const context = getContext({ user: testAdminUser });
  const result = await graphql(mySchema, query, rootValue, context);
  const { data } = result;

  expect(data.currentUser.email).toBe(testAdminUser.email);
});

it("should create an organization", async () => {
  if (testAdminUser) {
    const name = "Testy test organization";
    testOrganization = await createOrganization(testAdminUser, name);

    expect(testOrganization.data.createOrganization.name).toBe(
      "Testy test organization"
    );
  } else {
    throw Error("testAdminUser not defined");
  }
});

it("should create a test campaign", async () => {
  const campaignTitle = "test campaign";
  testCampaign = await createCampaign(
    testAdminUser,
    campaignTitle,
    "test description",
    testOrganization.data.createOrganization.id
  );

  expect(testCampaign.data.editCampaign.title).toBe(campaignTitle);
});

// TODO[fuzzy]: rewrite this to test the s3 upload contact flow
it("should create campaign contacts", async () => {
  const contact = await createContact(testCampaign.data.editCampaign.id);
  expect(contact.campaign_id).toBe(parseInt(testCampaign.data.editCampaign.id));
});

it("an admin can add texters to a organization by email", async () => {
  testTexterUser = await createUser({
    auth0_id: faker.random.uuid(),
    first_name: "TestTexterFirst",
    last_name: "TestTexterLast",
    cell: "555-555-6666",
    email: "testtexter@example.com"
  });

  const addQuery = `
  mutation addUserToOrganizationByEmail($organizationId: String!, $email: String!, $role: String!) {
    addUserToOrganizationByEmail(organizationId: $organizationId, email: $email, role: $role)
  }`;
  const variables = {
    organizationId: testOrganization.data.createOrganization.id,
    email: testTexterUser.email,
    role: "TEXTER"
  };
  const context = getContext({ user: testAdminUser });
  const result = await graphql(
    mySchema,
    addQuery,
    rootValue,
    context,
    variables
  );

  expect(result.data.addUserToOrganizationByEmail).toBeTruthy();
});

it("should assign texters to campaign contacts", async () => {
  const campaignEditQuery = `
  mutation editCampaign($campaignId: String!, $campaign: CampaignInput!) {
    editCampaign(id: $campaignId, campaign: $campaign) {
      id
      title
      description
      dueBy
      isStarted
      isArchived
      contactsCount
      datawarehouseAvailable
      customFields
      texters {
        id
        firstName
        assignment(campaignId:$campaignId) {
          contactsCount
          needsMessageCount: contactsCount(contactsFilter:{messageStatus:\"needsMessage\"})
        }
      }
      interactionSteps {
        id
        questionText
        script
        answerOption
        answerActions
        parentInteractionId
        isDeleted
      }
      cannedResponses {
        id
        title
        text
      }
    }
  }`;
  const context = getContext({ user: testAdminUser });
  const updateCampaign = Object.assign({}, testCampaign.data.editCampaign);
  const campaignId = updateCampaign.id;
  updateCampaign.texters = [
    {
      id: testTexterUser.id,
      needsMessageCount: 1
    }
  ];
  delete updateCampaign.id;
  delete updateCampaign.contacts;
  const variables = {
    campaignId: campaignId,
    campaign: updateCampaign
  };

  const result = await graphql(
    mySchema,
    campaignEditQuery,
    rootValue,
    context,
    variables
  );

  expect(result.data.editCampaign.texters.length).toBe(1);
  expect(result.data.editCampaign.texters[0].assignment.contactsCount).toBe(1);
});

// it('should save a campaign script composed of interaction steps', async() => {})

// it('should save some canned responses for texters', async() => {})

// it('should start the campaign', async() => {})

// TEST STUBS: MESSAGING

// it('should send an inital message to test contacts', async() => {})

describe("Campaign", () => {
  let organization;
  const adminUser = { is_superadmin: true, id: 1 };

  beforeEach(async () => {
    organization = await new Organization({
      name: "organization",
      texting_hours_start: 0,
      texting_hours_end: 0
    }).save();
  });

  describe("contacts", async () => {
    let campaigns;
    let contacts;
    beforeEach(async () => {
      campaigns = await Promise.all(
        [
          new Campaign({
            organization_id: organization.id,
            is_started: false,
            is_archived: false,
            due_by: new Date()
          }),
          new Campaign({
            organization_id: organization.id,
            is_started: false,
            is_archived: false,
            due_by: new Date()
          })
        ].map(async each => each.save())
      );

      contacts = await Promise.all(
        [
          new CampaignContact({
            campaign_id: campaigns[0].id,
            cell: "",
            message_status: "closed"
          }),
          new CampaignContact({
            campaign_id: campaigns[1].id,
            cell: "",
            message_status: "closed"
          })
        ].map(async each => each.save())
      );
    });

    test("resolves contacts", async () => {
      const results = await campaignResolvers.Campaign.contacts(
        campaigns[0],
        null,
        { user: adminUser }
      );
      expect(results).toHaveLength(1);
      expect(results[0].campaign_id).toEqual(campaigns[0].id);
    });

    test("resolves contacts count", async () => {
      const results = await campaignResolvers.Campaign.contactsCount(
        campaigns[0],
        null,
        { user: adminUser }
      );
      expect(results).toEqual(1);
    });

    test("resolves contacts count when empty", async () => {
      const campaign = await new Campaign({
        organization_id: organization.id,
        is_started: false,
        is_archived: false,
        due_by: new Date()
      }).save();
      const results = await campaignResolvers.Campaign.contactsCount(
        campaign,
        null,
        { user: adminUser }
      );
      expect(results).toEqual(0);
    });
  });

  describe("unassigned contacts", () => {
    let campaign;

    beforeEach(async () => {
      campaign = await new Campaign({
        organization_id: organization.id,
        is_started: false,
        is_archived: false,
        use_dynamic_assignment: true,
        due_by: new Date()
      }).save();
    });

    test("resolves unassigned contacts when true", async () => {
      const contact = await new CampaignContact({
        campaign_id: campaign.id,
        message_status: "closed",
        cell: ""
      }).save();

      const results = await campaignResolvers.Campaign.hasUnassignedContacts(
        campaign,
        null,
        { user: adminUser }
      );
      expect(results).toEqual(true);
      const resultsForTexter = await campaignResolvers.Campaign.hasUnassignedContactsForTexter(
        campaign,
        null,
        { user: adminUser }
      );
      expect(resultsForTexter).toEqual(true);
    });

    test("resolves unassigned contacts when false with assigned contacts", async () => {
      const user = await new User({
        auth0_id: "test12345",
        first_name: "TestUserFirst",
        last_name: "TestUserLast",
        cell: "555-555-5555",
        email: "testuser@example.com"
      }).save();

      const assignment = await new Assignment({
        user_id: user.id,
        campaign_id: campaign.id
      }).save();

      const contact = await new CampaignContact({
        campaign_id: campaign.id,
        assignment_id: assignment.id,
        message_status: "closed",
        cell: ""
      }).save();

      const results = await campaignResolvers.Campaign.hasUnassignedContacts(
        campaign,
        null,
        { user: adminUser }
      );
      expect(results).toEqual(false);
      const resultsForTexter = await campaignResolvers.Campaign.hasUnassignedContactsForTexter(
        campaign,
        null,
        { user: adminUser }
      );
      expect(resultsForTexter).toEqual(false);
    });

    test("resolves unassigned contacts when false with no contacts", async () => {
      const results = await campaignResolvers.Campaign.hasUnassignedContacts(
        campaign,
        null,
        { user: adminUser }
      );
      expect(results).toEqual(false);
    });

    test("test assignmentRequired access control", async () => {
      const user = await createUser();
      const assignment = await new Assignment({
        user_id: user.id,
        campaign_id: campaign.id
      }).save();

      const allowUser = await assignmentRequired(
        user,
        assignment.id,
        assignment
      );
      expect(allowUser).toEqual(true);
      const allowUserAssignmentId = await assignmentRequired(
        user,
        assignment.id
      );
      expect(allowUserAssignmentId).toEqual(true);
      try {
        const notAllowed = await assignmentRequired(user, -1);
        throw new Exception("should throw BEFORE this exception");
      } catch (err) {
        expect(/not authorized/.test(String(err))).toEqual(true);
      }
    });
  });
});
