/**
 * @jest-environment jsdom
 */
import React from "react";
import moment from "moment-timezone";
import { mount } from "enzyme";
import MuiThemeProvider from "material-ui/styles/MuiThemeProvider";
import { StyleSheetTestUtils } from "aphrodite";
import MockDate from "mockdate";

import { ConversationTexterContactComponent } from "src/containers/ConversationTexter/ConversationTexterContact";

jest.mock("../../src/lib/timezones");
jest.unmock("../../src/lib/tz-helpers");
jest.useFakeTimers();

const timezones = require("../../src/lib/timezones");

const campaign = {
  id: 9,
  isArchived: false,
  useDynamicAssignment: null,
  organization: {
    id: 2,
    textingHoursEnforced: true,
    textingHoursStart: 8,
    textingHoursEnd: 21,
    threeClickEnabled: false
  },
  customFields: [],
  interactionSteps: [
    {
      id: 11,
      question: {
        text: "",
        answerOptions: []
      }
    }
  ]
};

const propsWithEnforcedTextingHoursCampaign = {
  texter: {
    id: 2,
    firstName: "larry",
    lastName: "person",
    assignedCell: null
  },
  campaign,
  assignment: {
    id: 9,
    userCannedResponses: [],
    campaignCannedResponses: [],
    texter: {
      id: 2,
      firstName: "larry",
      lastName: "person",
      assignedCell: null
    },
    campaign,
    contacts: [
      {
        id: 19
      },
      {
        id: 20
      }
    ],
    allContactsCount: 2
  },
  refreshData: jest.fn(),
  data: {
    contact: {
      id: 19,
      assignmentId: 9,
      firstName: "larry",
      lastName: "person",
      cell: "+19734779697",
      zip: "10025",
      customFields: "{}",
      optOut: null,
      currentInteractionStepScript: "{firstName}",
      questionResponseValues: [],
      location: {
        city: "New York",
        state: "NY",
        timezone: {
          offset: -5,
          hasDST: true
        }
      },
      messageStatus: "needsMessage",
      messages: []
    }
  }
};

describe("when contact is within texting hours...", () => {
  beforeEach(() => {
    timezones.isBetweenTextingHours.mockReturnValue(true);
    timezones.getLocalTime.mockReturnValue(
      moment()
        .utc()
        .utcOffset(-5)
    );
    StyleSheetTestUtils.suppressStyleInjection();
    mount(
      <MuiThemeProvider>
        <ConversationTexterContactComponent
          texter={propsWithEnforcedTextingHoursCampaign.texter}
          campaign={campaign}
          assignment={propsWithEnforcedTextingHoursCampaign.assignment}
          refreshData={propsWithEnforcedTextingHoursCampaign.refreshData}
          data={propsWithEnforcedTextingHoursCampaign.data}
        />
      </MuiThemeProvider>
    );
  });
  afterEach(() => {
    propsWithEnforcedTextingHoursCampaign.refreshData.mockReset();
  });
  it("it does NOT refresh data in componentDidMount", () => {
    jest.runOnlyPendingTimers();
    expect(
      propsWithEnforcedTextingHoursCampaign.refreshData.mock.calls
    ).toHaveLength(0);
  });
});

describe("AssignmentTextContact has the proper enabled/disabled state when created", () => {
  it("is enabled if the contact is inside texting hours", () => {
    timezones.isBetweenTextingHours.mockReturnValueOnce(true);
    const assignmentTexterContact = new ConversationTexterContactComponent(
      propsWithEnforcedTextingHoursCampaign
    );
    expect(assignmentTexterContact.state.disabled).toBeFalsy();
    expect(assignmentTexterContact.state.disabledText).toEqual("Sending...");
  });

  it("is disabled if the contact is inside texting hours", () => {
    timezones.isBetweenTextingHours.mockReturnValueOnce(false);
    const assignmentTexterContact = new ConversationTexterContactComponent(
      propsWithEnforcedTextingHoursCampaign
    );
    expect(assignmentTexterContact.state.disabled).toBeTruthy();
    expect(assignmentTexterContact.state.disabledText).toEqual(
      "Refreshing ..."
    );
  });
});

describe("test isContactBetweenTextingHours", () => {
  let assignmentTexterContact;

  beforeAll(() => {
    assignmentTexterContact = new ConversationTexterContactComponent(
      propsWithEnforcedTextingHoursCampaign
    );
    timezones.isBetweenTextingHours.mockImplementation(() => false);
    MockDate.set("2018-02-01T15:00:00.000Z");
    timezones.getLocalTime.mockReturnValue(
      moment()
        .utc()
        .utcOffset(-5)
    );
  });

  afterAll(() => {
    MockDate.reset();
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("works when the contact has location data with empty timezone", () => {
    const contact = {
      location: {
        city: "New York",
        state: "NY",
        timezone: {
          offset: null,
          hasDST: null
        }
      }
    };

    expect(
      assignmentTexterContact.isContactBetweenTextingHours(
        contact,
        propsWithEnforcedTextingHoursCampaign
      )
    ).toBeFalsy();
    expect(timezones.isBetweenTextingHours.mock.calls).toHaveLength(1);

    const theCall = timezones.isBetweenTextingHours.mock.calls[0];
    expect(theCall[0]).toBeFalsy();
    expect(theCall[1]).toEqual({
      textingHoursStart: 8,
      textingHoursEnd: 21,
      textingHoursEnforced: true
    });
  });

  it("works when the contact has location data", () => {
    const contact = {
      location: {
        city: "New York",
        state: "NY",
        timezone: {
          offset: -5,
          hasDST: true
        }
      }
    };

    expect(
      assignmentTexterContact.isContactBetweenTextingHours(
        contact,
        propsWithEnforcedTextingHoursCampaign
      )
    ).toBeFalsy();
    expect(timezones.isBetweenTextingHours.mock.calls).toHaveLength(1);

    const theCall = timezones.isBetweenTextingHours.mock.calls[0];
    expect(theCall[0]).toEqual({ hasDST: true, offset: -5 });
    expect(theCall[1]).toEqual({
      textingHoursStart: 8,
      textingHoursEnd: 21,
      textingHoursEnforced: true
    });
  });

  it("works when the contact does not have location data", () => {
    const contact = {};

    expect(
      assignmentTexterContact.isContactBetweenTextingHours(
        contact,
        propsWithEnforcedTextingHoursCampaign
      )
    ).toBeFalsy();
    expect(timezones.isBetweenTextingHours.mock.calls).toHaveLength(1);

    const theCall = timezones.isBetweenTextingHours.mock.calls[0];
    expect(theCall[0]).toBeNull();
    expect(theCall[1]).toEqual({
      textingHoursStart: 8,
      textingHoursEnd: 21,
      textingHoursEnforced: true
    });
  });
});
