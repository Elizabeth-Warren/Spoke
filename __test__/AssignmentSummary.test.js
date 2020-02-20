/**
 * @jest-environment jsdom
 */

jest.mock("src/containers/RequestBatchButton");

import React from "react";
import { mount } from "enzyme";
import { StyleSheetTestUtils } from "aphrodite";
import injectTapEventPlugin from "react-tap-event-plugin";
import MuiThemeProvider from "material-ui/styles/MuiThemeProvider";
import { CardActions, CardTitle } from "material-ui/Card";
import { AssignmentSummary } from "../src/components/AssignmentSummary";
import Badge from "material-ui/Badge/Badge";
import RaisedButton from "material-ui/RaisedButton/RaisedButton";
import RequestBatchButton from "src/containers/RequestBatchButton";

function getAssignment(
  isDynamic = false,
  hasUnassignedContactsForTexter = true
) {
  return {
    id: "1",
    campaign: {
      id: "1",
      status: "ACTIVE",
      title: "New Campaign",
      description: "asdf",
      useDynamicAssignment: isDynamic,
      hasUnassignedContacts: false,
      introHtml: "yoyo",
      primaryColor: "#2052d8",
      logoImageUrl: "",
      hasUnassignedContactsForTexter
    }
  };
}

describe("AssignmentSummary text", function t() {
  beforeEach(() => {
    this.summary = mount(
      <MuiThemeProvider>
        <AssignmentSummary
          assignment={getAssignment()}
          unmessagedCount={1}
          conversationCount={0}
          isWithinTextingHours
        />
      </MuiThemeProvider>
    );
  });

  test("renders title and html", () => {
    // Note: Warren fork does not support ALLOW_SEND_ALL
    window.NOT_IN_USA = 0;
    window.ALLOW_SEND_ALL = false;
    const title = this.summary.find(CardTitle);
    expect(title.prop("title")).toBe("New Campaign");
    // expect(title.find(CardTitle).prop('subtitle')).toBe('asdf - Jan 31 2018')

    const htmlWrapper = this.summary.findWhere(
      d => d.length && d.type() === "div" && d.prop("dangerouslySetInnerHTML")
    );
    expect(htmlWrapper.prop("dangerouslySetInnerHTML")).toEqual({
      __html: "yoyo"
    });
  });
});

describe("AssignmentSummary actions inUSA and NOT AllowSendAll", () => {
  injectTapEventPlugin(); // prevents warning
  function create(
    unmessaged,
    conversations,
    needsResponseCount,
    isWithinTextingHours,
    isDynamic
  ) {
    window.NOT_IN_USA = 0;
    window.ALLOW_SEND_ALL = false;
    return mount(
      <MuiThemeProvider>
        <AssignmentSummary
          assignment={getAssignment(isDynamic)}
          unmessagedCount={unmessaged}
          conversationCount={conversations}
          needsResponseCount={needsResponseCount}
          isWithinTextingHours
        />
      </MuiThemeProvider>
    ).find(CardActions);
  }

  it('renders "send first texts (1)" with unmessaged (dynamic assignment)', () => {
    const actions = create(5, 0, 0, true, true);
    expect(
      actions
        .find(RequestBatchButton)
        .at(0)
        .prop("unsentCount")
    ).toBe(5);
    expect(
      actions
        .find(RequestBatchButton)
        .at(0)
        .prop("buttonLabel")
    ).toBe("Finish Text Batch");
  });

  it('renders "send first texts (1)" with unmessaged (non-dynamic)', () => {
    const actions = create(1, 0, 0, true, false);
    expect(
      actions
        .find(RequestBatchButton)
        .at(0)
        .prop("unsentCount")
    ).toBe(1);
    expect(
      actions
        .find(RequestBatchButton)
        .at(0)
        .prop("buttonLabel")
    ).toBe("Finish Text Batch");
  });

  it('renders "send first texts" with no unmessaged (dynamic assignment)', () => {
    const actions = create(0, 0, 0, true, true);
    expect(
      actions
        .find(RequestBatchButton)
        .at(0)
        .prop("unsentCount")
    ).toBe(0);
    expect(
      actions
        .find(RequestBatchButton)
        .at(0)
        .prop("buttonLabel")
    ).toBe("Send Initial Texts");
  });

  it('renders the "conversations" button with no badge if no conversations need a response', () => {
    const actions = create(0, 7, 0, true, false);
    expect(actions.find(RaisedButton).length).toBe(1);
    expect(actions.find(Badge).at(0)).toEqual({});
  });

  it('renders the "conversations" button with a badge for conversations that need response', () => {
    const actions = create(0, 7, 3, true, false);
    expect(actions.find(RaisedButton).length).toBe(1);
    expect(
      actions
        .find(Badge)
        .at(0)
        .prop("badgeContent")
    ).toBe(3);
  });
});

it('renders "Send Later" when out of texting hours', () => {
  const actions = mount(
    <MuiThemeProvider>
      <AssignmentSummary
        assignment={getAssignment()}
        unmessagedCount={4}
        conversationCount={2}
        isWithinTextingHours={false}
      />
    </MuiThemeProvider>
  ).find(CardActions);
  console.log(actions);
  expect(
    actions
      .find(RaisedButton)
      .at(0)
      .prop("label")
  ).toBe("Send Later");
});

// https://github.com/Khan/aphrodite/issues/62#issuecomment-267026726
beforeEach(() => {
  StyleSheetTestUtils.suppressStyleInjection();
});

afterEach(() => {
  StyleSheetTestUtils.clearBufferAndResumeStyleInjection();
});
