import gql from "graphql-tag";

export const schema = gql`
  input LabelInput {
    organizationId: ID!
    group: String
    displayValue: String!
    slug: String
  }

  type Label {
    id: ID!
    organizationId: ID!
    group: String
    displayValue: String!
    slug: String!
    createdBy: User
    createdAt: Date!
  }
`;
