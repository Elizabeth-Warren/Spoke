import React from "react";
import { shallow } from "enzyme";
import { StyleSheetTestUtils } from "aphrodite";

import { genAssignment, contactGenerator } from "../test_client_helpers";
import { AssignmentTexter } from "src/containers/AssignmentTexter";

/*
    These tests try to ensure the 'texting loop' -- i.e. the loop between
    a texter getting contact data, sending a text, iterating through
    another contact and then texting them, etc.

    Many asynchronous events occur and this component AssignmentTexter is
    pretty much the orchestrator of that loop.  Its parent container, TexterTodo,
    is in charge of actually getting the data through GraphQL requests, and
    the child container AssignmentTexterContact is the user interface where the
    messages are sent.

    In summary, the texting loop is:

    * handleFinishContact (triggered from AssignmentTexterContact)
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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function genComponent(assignment, propertyOverrides = {}) {
  StyleSheetTestUtils.suppressStyleInjection();
  const wrapper = shallow(
    <AssignmentTexter
      assignment={assignment}
      contactsPreview={assignment.contacts}
      allContactsCount={assignment.allContactsCount}
      router={{ push: () => {} }}
      refreshData={() => {}}
      getNewContacts={() => {}}
      organizationId={"123"}
      {...propertyOverrides}
    />
  );
  return wrapper;
}

// TODO: this test really doesn't do much, add more
describe("AssignmentTexter process flows", () => {
  it("Advances for a normal nondynamic assignment queue", async () => {
    const assignment = genAssignment(
      false,
      true,
      /* contacts=*/ 6,
      "needsMessage"
    );
    //     const createContact = contactGenerator(assignment.id, "needsMessage");
    const wrapper = genComponent(assignment, {});
    const component = wrapper.instance();
    let contactsContacted = 0;
    while (component.hasNext()) {
      component.handleAdvanceContact();
      contactsContacted += 1;
      // await sleep(1); // triggers updates
    }
    // last contact
    component.handleAdvanceContact();
    contactsContacted += 1;
    // await sleep(1);
    expect(contactsContacted).toBe(6);
  });
});
