import gql from "graphql-tag";

// TODO allow passing an array of contact ids to the filter?
export const schema = gql`
  input ContactsFilter {
    contactId: ID
    cell: String
    messageStatus: String
    isOptedOut: Boolean
    validTimezone: Boolean
    includePastDue: Boolean
    tags: [String]
    includeResolvedTags: Boolean
  }

  type Timezone {
    offset: Int
    hasDST: Boolean
  }

  type Location {
    timezone: Timezone
    city: String
    state: String
  }

  type Tag {
    tag: String!
    comment: String
    createdBy: User!
    createdAt: Date
    resolvedBy: User
    resolvedAt: Date
  }

  type CampaignContact {
    id: ID
    firstName: String
    lastName: String
    cell: Phone
    external_id: String
    external_id_type: String
    state_code: String
    customFields: JSON
    messages: [Message]
    location: Location
    optOut: OptOut
    campaign: Campaign
    questionResponseValues: [AnswerOption]
    questionResponses: [AnswerOption]
    interactionSteps: [InteractionStep]
    messageStatus: String
    assignmentId: String
    tags: [Tag]
    hasUnresolvedTags: Boolean
    updatedAt: Date
    issues: [String]
    cannedResponseId: [Int]
  }
`;
