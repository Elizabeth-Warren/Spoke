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
    reservedAt: DateTime
    campaignTitle: String
    
  }

  type PhoneNumberCountsByStatus {
    areaCode: String!
    availableCount: Int!
    reservedCount: Int!
    assignedCount: Int!
  }
`;
