import gql from "graphql-tag";

import { schema as userSchema } from "./user";
import { schema as conversationSchema } from "./conversations";
import { schema as organizationSchema } from "./organization";
import { schema as campaignSchema } from "./campaign";
import { schema as assignmentSchema } from "./assignment";
import { schema as interactionStepSchema } from "./interaction-step";
import { schema as questionSchema } from "./question";
import { schema as questionResponseSchema } from "./question-response";
import { schema as optOutSchema } from "./opt-out";
import { schema as messageSchema } from "./message";
import { schema as campaignContactSchema } from "./campaign-contact";
import { schema as cannedResponseSchema } from "./canned-response";
import { schema as twilioPhoneNumberSchema } from "./twilio-phone-number";
import { schema as backgroundJobSchema } from "./background-job";

const rootSchema = gql`
  input CampaignContactInput {
    firstName: String!
    lastName: String!
    cell: String!
    external_id: String
    external_id_type: String
    state_code: String
    customFields: String
  }

  input OptOutInput {
    assignmentId: String!
    cell: Phone!
    reason: String
  }

  input QuestionResponseInput {
    campaignContactId: String!
    interactionStepId: String!
    value: String!
  }

  input AnswerOptionInput {
    action: String
    value: String!
    nextInteractionStepId: String
  }

  input InteractionStepInput {
    id: String
    questionText: String
    script: String
    answerOption: String
    answerActions: String
    parentInteractionId: String
    isDeleted: Boolean
    interactionSteps: [InteractionStepInput]
  }

  input TexterInput {
    id: String
    needsMessageCount: Int
    maxContacts: Int
    contactsCount: Int
  }

  input CampaignPhoneNumberInput {
    areaCode: String
    count: Int
  }

  input CampaignInput {
    title: String
    description: String
    dueBy: Date
    logoImageUrl: String
    primaryColor: String
    introHtml: String
    useDynamicAssignment: Boolean
    organizationId: String
    texters: [TexterInput]
    interactionSteps: InteractionStepInput
    cannedResponses: [CannedResponseInput]
    overrideOrganizationTextingHours: Boolean
    phoneNumbers: CampaignPhoneNumberInput
    textingHoursEnforced: Boolean
    textingHoursStart: Int
    textingHoursEnd: Int
    timezone: String
    shiftingConfiguration: String
  }

  input MessageInput {
    text: String!
    contactNumber: Phone
    assignmentId: String!
    userId: String
    cannedResponseId: Int
    isInitialMessage: Boolean
  }

  input UserInput {
    id: String
    firstName: String!
    lastName: String!
    email: String
  }

  input ContactMessage {
    message: MessageInput!
    campaignContactId: String!
  }

  input OffsetLimitCursor {
    offset: Int!
    limit: Int!
  }

  input CampaignIdContactId {
    campaignId: String!
    campaignContactId: Int!
    messageIds: [Int]!
  }

  input UserPasswordChange {
    email: String!
    password: String!
    passwordConfirm: String!
    newPassword: String!
  }

  type CampaignIdAssignmentId {
    campaignId: String!
    assignmentId: String!
  }

  type Action {
    name: String
    display_name: String
    instructions: String
  }

  type FoundContact {
    found: Boolean
  }

  type PageInfo {
    limit: Int!
    offset: Int!
    next: Int
    previous: Int
    total: Int!
  }

  type RolesForOrg {
    orgId: Int!
    role: String
  }

  type ReturnString {
    data: String!
  }

  enum SortPeopleBy {
    FIRST_NAME
    LAST_NAME
    NEWEST
    OLDEST
  }

  enum FilterPeopleBy {
    FIRST_NAME
    LAST_NAME
    EMAIL
    ANY
  }

  enum SortCampaignsBy {
    DUE_DATE_ASC
    DUE_DATE_DESC
    ID_ASC
    ID_DESC
    TITLE
  }

  enum AddUserByEmailResult {
    USER_ADDED
    USER_ALREADY_IN_ORG
    NO_USER_WITH_EMAIL
  }

  type RootQuery {
    currentUser: User
    currentUserWithAccess(organizationId: String!, role: String!): User
    organization(id: String!, utc: String): Organization
    campaign(id: String!): Campaign
    contact(id: String!): CampaignContact
    assignment(id: String!): Assignment
    organizations: [Organization]
    availableActions(organizationId: String!): [Action]
    conversations(
      cursor: OffsetLimitCursor!
      organizationId: String!
      campaignsFilter: CampaignsFilter
      assignmentsFilter: AssignmentsFilter
      contactsFilter: ContactsFilter
      utc: String
    ): PaginatedConversations
    campaigns(
      organizationId: String!
      cursor: OffsetLimitCursor
      campaignsFilter: CampaignsFilter
      sortBy: SortCampaignsBy
    ): CampaignsReturn
    people(
      organizationId: String!
      cursor: OffsetLimitCursor
      campaignsFilter: CampaignsFilter
      role: String
      sortBy: SortPeopleBy
      filterString: String
      filterBy: FilterPeopleBy
    ): UsersReturn
    backgroundJob(jobId: ID!): BackgroundJob
  }

  type RootMutation {
    createCampaign(campaign: CampaignInput!, contactsS3Key: String!): Campaign
    editCampaign(id: String!, campaign: CampaignInput!): Campaign
    copyCampaign(
      id: String!
      contactsS3Key: String!
      shiftingConfiguration: String
    ): Campaign
    exportCampaign(id: String!): BackgroundJob
    createOrganization(name: String!): Organization
    editOrganizationRoles(
      organizationId: String!
      userId: String!
      campaignId: String
      roles: [String]
    ): Organization
    editUser(organizationId: String!, userId: Int!, userData: UserInput): User
    resetUserPassword(organizationId: String!, userId: Int!): String!
    changeUserPassword(userId: Int!, formData: UserPasswordChange): User
    initiatePasswordReset(organizationId: String!, userId: String!): Boolean
    updateTextingHours(
      organizationId: String!
      textingHoursStart: Int!
      textingHoursEnd: Int!
    ): Organization
    updateTextingHoursEnforcement(
      organizationId: String!
      textingHoursEnforced: Boolean!
    ): Organization
    updateOptOutMessage(
      organizationId: String!
      optOutMessage: String!
    ): Organization
    enableCampaignPhoneNumbers(organizationId: String!): Organization
    sendMessage(
      message: MessageInput!
      campaignContactId: String!
    ): CampaignContact
    createOptOut(
      optOut: OptOutInput!
      campaignContactId: String!
    ): CampaignContact
    editCampaignContactMessageStatus(
      messageStatus: String!
      campaignContactId: String!
    ): CampaignContact
    addTagsToCampaignContacts(
      campaignContactIds: [String]!
      tags: [String]!
      comment: String
    ): Boolean
    resolveTags(campaignContactIds: [String]!, tags: [String]!): Boolean
    deleteQuestionResponses(
      interactionStepIds: [String]
      campaignContactId: String!
    ): CampaignContact
    updateQuestionResponses(
      questionResponses: [QuestionResponseInput]
      campaignContactId: String!
    ): CampaignContact
    startCampaign(id: String!): Campaign
    archiveCampaign(id: String!): Campaign
    archiveCampaigns(ids: [String!]): [Campaign]
    unarchiveCampaign(id: String!): Campaign
    sendReply(id: String!, message: String!): CampaignContact
    findNewCampaignContact(
      assignmentId: String!
      numberContacts: Int
    ): FoundContact
    assignUserToCampaign(token: String!): Campaign
    userAgreeTerms: User
    reassignCampaignContacts(
      organizationId: String!
      campaignIdsContactIds: [CampaignIdContactId]!
      newTexterUserId: String!
    ): [CampaignIdAssignmentId]
    bulkReassignCampaignContacts(
      organizationId: String!
      campaignsFilter: CampaignsFilter
      assignmentsFilter: AssignmentsFilter
      contactsFilter: ContactsFilter
      newTexterUserId: String!
    ): [CampaignIdAssignmentId]
    importCampaignScript(campaignId: String!, url: String!): Int
    addUserToOrganizationByEmail(
      organizationId: String!
      email: String!
      role: String!
    ): AddUserByEmailResult
    createPresignedUploadUrl(organizationId: ID!): String
    uploadContacts(campaignId: String!, s3Key: String!): Int
  }

  schema {
    query: RootQuery
    mutation: RootMutation
  }
`;

export const schema = [
  rootSchema,
  userSchema,
  organizationSchema,
  "scalar Date",
  "scalar JSON",
  "scalar Phone",
  campaignSchema,
  assignmentSchema,
  interactionStepSchema,
  optOutSchema,
  messageSchema,
  campaignContactSchema,
  cannedResponseSchema,
  questionResponseSchema,
  questionSchema,
  conversationSchema,
  twilioPhoneNumberSchema,
  backgroundJobSchema
];
