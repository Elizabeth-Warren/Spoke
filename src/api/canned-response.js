export const schema = `
  input CannedResponseInput {
    id: String
    title: String
    text: String
    surveyQuestion: String
    campaignId: String
    userId: String
    deleted: Boolean
    isNew: Boolean
    labelIds: [ID]
  }

  type CannedResponse {
    id: ID
    title: String
    text: String
    surveyQuestion: String
    isUserCreated: Boolean
    deleted: Boolean
    labels: [Label]
  }
`;
