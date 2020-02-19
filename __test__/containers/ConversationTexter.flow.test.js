import React from "react";
import { shallow } from "enzyme";
import { StyleSheetTestUtils } from "aphrodite";

import { genAssignment } from "../test_client_helpers";
import { ConversationTexterComponent } from "src/containers/ConversationTexter";

/*
    These tests try to ensure the 'texting loop' -- i.e. the loop between
    a texter getting contact data, sending a text, iterating through
    another contact and then texting them, etc.

    Many asynchronous events occur and this component ConversationTexter is
    pretty much the orchestrator of that loop.  Its parent container, TexterTodo,
    is in charge of actually getting the data through GraphQL requests, and
    the child container ConversationTexterContact is the user interface where the
    messages are sent.

    In summary, the texting loop is:

    * handleFinishContact (triggered from ConversationTexterContact)
      if hasnext:
        * navigationnext()
          * getcontactdata(newindex)
            if [needs more]:
               props.getnewcontacts()
                [DELAY] componentWillUpdate()
                [OR no new contacts]
            if [getIds]:
               props.loadContacts(getIds)
               [DELAY] return data
        * clearcontactidolddata(contactid)
      else
        * props.assigncontactsifneeded()
          * clearcontactidolddata(contactid)
*/

function genComponent(assignment) {
  StyleSheetTestUtils.suppressStyleInjection();
  const wrapper = shallow(
    <ConversationTexterComponent
      params={{ organizationId: 123, assignmentId: assignment.id }}
      data={{
        findNewCampaignContact: { found: false },
        refetch: () => {},
        assignment
      }}
      conversationData={{ contactsForAssignment: assignment.contacts }}
      router={{ push: () => {} }}
    />
  );
  return wrapper;
}

// TODO: this test really doesn't do much, add more
describe("ConversationTexter process flows", () => {
  it("Advances for a normal nondynamic assignment queue", async () => {
    const assignment = genAssignment(
      false,
      true,
      /* contacts=*/ 6,
      "needsMessage"
    );

    const wrapper = genComponent(assignment, {});
    const component = wrapper.instance();
    let contactsContacted = 0;

    while (component.getNextConversationId() !== 1) {
      component.handleAdvanceContact();
      contactsContacted += 1;
    }

    // last contact
    component.handleAdvanceContact();
    contactsContacted += 1;

    expect(contactsContacted).toBe(6);
  });
});
