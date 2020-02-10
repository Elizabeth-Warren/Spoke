import gql from "graphql-tag";

export const schema = gql`
  enum PhoneNumberStatus {
    AVAILABLE
    RESERVED
    ASSIGNED
  }

  type PhoneNumbersByAreaCode {
    areaCode: String!
    count: Int!
  }
`;
