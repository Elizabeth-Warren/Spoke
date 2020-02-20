export const schema = `
  type User {
    id: ID
    firstName: String
    lastName: String
    displayName: String
    email: String
    cell: String
    organizations(role: String): [Organization]
    assignmentSummaries(organizationId: String!): [AssignmentSummary]
    roles(organizationId: String!): [String]
    allRoles: [RolesForOrg]
    assignedCell: Phone
    assignment(campaignId: String): Assignment
    terms: Boolean
  }

type UsersList {
  users: [User]
}

type PaginatedUsers {
  users: [User]
  pageInfo: PageInfo
}

type ContactCountByMessageStatus {
  messageStatus: String!
  count: Int!
}

type AssignmentSummary {
  assignment: Assignment!
  contactCounts: [ContactCountByMessageStatus]!
}

union UsersReturn = PaginatedUsers | UsersList
`;
