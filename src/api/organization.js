import gql from "graphql-tag";

export const schema = gql`
  type Organization {
    id: ID
    uuid: String
    name: String
    campaigns(
      cursor: OffsetLimitCursor
      campaignsFilter: CampaignsFilter
      sortBy: SortCampaignsBy
    ): CampaignsReturn
    people(role: String, campaignId: String, sortBy: SortPeopleBy): [User]
    optOuts: [OptOut]
    threeClickEnabled: Boolean
    optOutMessage: String
    textingHoursEnforced: Boolean
    textingHoursStart: Int
    textingHoursEnd: Int
    campaignPhoneNumbersEnabled: Boolean!
    availablePhoneNumbers: [PhoneNumbersByAreaCode]
    phoneNumbersByStatus: [PhoneNumberCountsByStatus]
    maxContacts: Int
    labels: [Label]!
  }
`;
