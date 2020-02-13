import gql from "graphql-tag";

export const schema = gql`
  enum BackgroundJobStatus {
    PENDING
    RUNNING
    FAILED
    DONE
  }

  type BackgroundJob {
    id: ID!
    campaignId: ID
    organizationId: ID
    userId: ID
    resultMessage: String
    progress: Float
    status: BackgroundJobStatus
    createdAt: Date
    updatedAt: Date
  }
`;
