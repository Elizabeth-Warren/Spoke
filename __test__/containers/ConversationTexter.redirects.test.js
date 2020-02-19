/**
 * @jest-environment jsdom
 */

jest.mock("src/containers/RequestBatchButton");

import React from "react";
import { mount } from "enzyme";
import MuiThemeProvider from "material-ui/styles/MuiThemeProvider";
import { StyleSheetTestUtils } from "aphrodite";

import { genAssignment, contactGenerator } from "../test_client_helpers";
import { ConversationTexterComponent } from "src/containers/ConversationTexter";

function genComponent(
  isArchived,
  hasContacts,
  routerPushes,
  statusMessage,
  assignmentNull
) {
  const assignmentId = 8;
  const contactMapper = contactGenerator(assignmentId, statusMessage);
  let assignment = genAssignment(assignmentId, isArchived, hasContacts);
  if (assignmentNull) {
    assignment = null;
  }
  StyleSheetTestUtils.suppressStyleInjection();
  return mount(
    <MuiThemeProvider>
      <ConversationTexterComponent
        messageStatus={statusMessage}
        params={{ organizationId: 123, assignmentId }}
        data={{
          findNewCampaignContact: { found: false },
          refetch: () => {},
          assignment
        }}
        conversationData={{
          contactsForAssignment: []
        }}
        router={routerPushes} // used to push redirect
      />
    </MuiThemeProvider>
  );
}

describe("ConversationTexter tests...", () => {
  it("redirect if the assignment is archived", () => {
    const routerPushes = [];
    const isArchived = true;
    const hasContacts = true;

    genComponent(isArchived, hasContacts, routerPushes, "needsMessage");

    expect(routerPushes[0]).toBe("/app/123/todos");
  });

  it("redirect if the assignment is null", () => {
    const routerPushes = [];
    const isArchived = false;
    const hasContacts = true;
    const assignmentNull = true;

    genComponent(
      isArchived,
      hasContacts,
      routerPushes,
      "needsMessage",
      assignmentNull
    );

    expect(routerPushes[0]).toBe("/app/123/todos");
  });

  it("redirect if the assignment is normal no redirects", () => {
    const routerPushes = [];
    const isArchived = false;
    const hasContacts = true;

    genComponent(isArchived, hasContacts, routerPushes, "needsMessage");

    expect(routerPushes).toEqual([]);
  });
});
