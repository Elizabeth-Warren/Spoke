import gql from "graphql-tag";

export const schema = gql`
  input ContactsFilter {
    contactId: ID
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
    zip: String
    external_id: String
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
  }
`;
