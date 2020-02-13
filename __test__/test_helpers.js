import _ from "lodash";
import {
  createLoaders,
  Campaign,
  User,
  CampaignContact,
  r
} from "../src/server/models/";
import { graphql } from "graphql";
import db from "src/server/db";
import faker from "faker";

const ALL_TABLES = [
  "knex_migrations",
  "knex_migrations_lock",
  ...Object.values(db.Table)
];
// TODO: create and drop a fresh schema for every test suite instead
export async function setupTest() {
  await r.knex.migrate.latest();
}

export async function cleanupTest() {
  for (const table of ALL_TABLES) {
    await r.knex.raw(`DROP TABLE IF EXISTS "${table}" CASCADE`);
  }
}

export function getContext(context) {
  return {
    ...context,
    req: {},
    loaders: createLoaders()
  };
}
import loadData from "../src/containers/hoc/load-data";
jest.mock("../src/containers/hoc/load-data");
/* Used to get graphql queries from components.
*  Because of some limitations with the jest require cache that
*  I can't find a way of getting around, it should only be called once
*  per test.

*  The query it returns will be that of the requested component, but
*  the mutations will be merged from the component and its children.
*/
export function getGql(componentPath, props) {
  require(componentPath); // eslint-disable-line

  const { mapQueriesToProps } = _.last(loadData.mock.calls)[1];

  const mutations = loadData.mock.calls.reduce((acc, mapping) => {
    if (!mapping[1].mapMutationsToProps) return acc;
    return {
      ...acc,
      ..._.mapValues(
        mapping[1].mapMutationsToProps({ ownProps: props }),
        mutation => (...params) => {
          const m = mutation(...params);
          return [m.mutation.loc.source.body, m.variables];
        }
      )
    };
  }, {});

  let query;
  if (mapQueriesToProps) {
    const data = mapQueriesToProps({ ownProps: props }).data;
    query = [data.query.loc.source.body, data.variables];
  }

  return { query, mutations };
}

export async function createUser(
  userInfo = {
    auth0_id: "test123",
    first_name: "TestUserFirst",
    last_name: "TestUserLast",
    cell: "555-555-5555",
    email: "testuser@example.com"
  }
) {
  const user = new User(userInfo);
  await user.save();
  return user;
}

export async function createContact(campaign) {
  const campaignId = campaign.id;

  const contact = new CampaignContact({
    first_name: "Ann",
    last_name: "Lewis",
    cell: "5555555555",
    zip: "12345",
    campaign_id: campaignId
  });
  await contact.save();
  return contact;
}

import { makeExecutableSchema } from "graphql-tools";
import { resolvers } from "../src/server/api/schema";
import { schema } from "../src/api/schema";

const mySchema = makeExecutableSchema({
  typeDefs: schema,
  resolvers,
  allowUndefinedInResolve: true
});

const rootValue = {};

export async function runGql(query, vars, user) {
  const context = getContext({ user });
  return await graphql(mySchema, query, rootValue, context, vars);
}

export async function createOrganization(user, name) {
  const context = getContext({ user });

  const orgQuery = `mutation createOrganization($name: String!) {
    createOrganization(name: $name) {
      id
      uuid
    }
  }`;

  const variables = { name: name || faker.company.companyName() };
  return await graphql(mySchema, orgQuery, rootValue, context, variables);
}

export async function createCampaign(user, organization) {
  const title = "test campaign";
  const description = "test description";
  const organizationId = organization.data.createOrganization.id;
  const context = getContext({ user });

  const campaignInstance = new Campaign({
    organization_id: organizationId,
    creator_id: user.id,
    title,
    description,
    due_by: null,
    is_started: false,
    is_archived: false
  });

  await campaignInstance.save();

  const campaignQuery = `mutation editCampaign($id: String!, $input: CampaignInput!) {
    editCampaign(id: $id, campaign: $input) {
      id
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
  const ret = await graphql(
    mySchema,
    campaignQuery,
    rootValue,
    context,
    variables
  );
  console.log(ret);
  return ret.data.editCampaign;
}

export async function setupCampaignFixture() {
  const user = await createUser({
    auth0_id: faker.random.uuid(),
    first_name: faker.name.firstName(),
    last_name: faker.name.lastName(),
    cell: faker.phone.phoneNumber("+1##########"),
    email: faker.internet.email()
  });
  const organization = await createOrganization(user);
  const campaign = await createCampaign(user, organization);
  return { user, organization, campaign };
}

export async function createTexter(organization, addedBy) {
  const user = await createUser({
    auth0_id: "test456",
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
    organizationId: organization.data.createOrganization.id,
    email: user.email,
    role: "TEXTER"
  };

  const context = getContext({ user: addedBy });
  await graphql(mySchema, addQuery, rootValue, context, variables);
  return user;
}

export async function assignTexter(admin, user, campaign) {
  const campaignEditQuery = `
  mutation editCampaign($campaignId: String!, $campaign: CampaignInput!) {
    editCampaign(id: $campaignId, campaign: $campaign) {
      id
    }
  }`;
  const context = getContext({ user: admin });
  const updateCampaign = Object.assign({}, campaign);
  const campaignId = updateCampaign.id;
  updateCampaign.texters = [
    {
      id: user.id
    }
  ];
  delete updateCampaign.id;
  delete updateCampaign.contacts;
  const variables = {
    campaignId,
    campaign: updateCampaign
  };
  return await graphql(
    mySchema,
    campaignEditQuery,
    rootValue,
    context,
    variables
  );
}

export async function createScript(admin, campaign) {
  const campaignEditQuery = `
  mutation editCampaign($campaignId: String!, $campaign: CampaignInput!) {
    editCampaign(id: $campaignId, campaign: $campaign) {
      id
    }
  }`;
  const context = getContext({ user: admin });
  const campaignId = campaign.id;
  const variables = {
    campaignId,
    campaign: {
      interactionSteps: {
        id: "1",
        questionText: "Test",
        script: "{zip}",
        answerOption: "",
        answerActions: "",
        parentInteractionId: null,
        isDeleted: false,
        interactionSteps: [
          {
            id: "2",
            questionText: "hmm",
            script: "{lastName}",
            answerOption: "hmm",
            answerActions: "",
            parentInteractionId: "1",
            isDeleted: false,
            interactionSteps: []
          }
        ]
      }
    }
  };
  return await graphql(
    mySchema,
    campaignEditQuery,
    rootValue,
    context,
    variables
  );
}

jest.mock("../src/server/mail");
export async function startCampaign(admin, campaign) {
  const startCampaignQuery = `mutation startCampaign($campaignId: String!) {
    startCampaign(id: $campaignId) {
      id
    }
  }`;
  const context = getContext({ user: admin });
  const variables = { campaignId: campaign.id };
  return await graphql(
    mySchema,
    startCampaignQuery,
    rootValue,
    context,
    variables
  );
}

export async function getCampaignContact(id) {
  return await r
    .knex("campaign_contact")
    .where({ id })
    .first();
}
