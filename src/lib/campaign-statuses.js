export const CampaignStatus = {
  ACTIVE: "ACTIVE",
  ARCHIVED: "ARCHIVED",
  CLOSED: "CLOSED",
  CLOSED_FOR_INITIAL_SENDS: "CLOSED_FOR_INITIAL_SENDS",
  NOT_STARTED: "NOT_STARTED"
};

export const CampaignStatusValues = {
  ACTIVE: {
    display: "Active",
    value: CampaignStatus.ACTIVE
  },
  CLOSED_FOR_INITIAL_SENDS: {
    display: "Closed for Initial Sends",
    value: CampaignStatus.CLOSED_FOR_INITIAL_SENDS
  },
  CLOSED: {
    display: "Closed",
    value: CampaignStatus.CLOSED
  },
  NOT_STARTED: {
    display: "Not Started",
    value: CampaignStatus.NOT_STARTED
  },
  ARCHIVED: {
    display: "Archived",
    value: CampaignStatus.ARCHIVED
  }
};

export const getStatusDisplayName = status =>
  (
    Object.values(CampaignStatusValues).find(({ value }) => value === status) ||
    {}
  ).display;
