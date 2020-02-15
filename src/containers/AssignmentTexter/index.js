import PropTypes from "prop-types";
import React from "react";
import LoadingIndicator from "src/components/LoadingIndicator";
import { StyleSheet, css } from "aphrodite";
import { withRouter } from "react-router";
import Check from "material-ui/svg-icons/action/check-circle";
import Empty from "src/components/Empty";
import RaisedButton from "material-ui/RaisedButton";
import AssignmentTexterContact from "./AssignmentTexterContact";
import _ from "lodash";

const styles = StyleSheet.create({
  container: {
    position: "fixed",
    top: 0,
    left: 0,
    // right: 0,
    // bottom: 0
    width: "100%",
    height: "100%",
    zIndex: 1002,
    backgroundColor: "white",
    overflow: "hidden"
  },
  navigationToolbarTitle: {
    fontSize: "12px"
  }
});

export class AssignmentTexter extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      currentContactIndex: 0,
      loading: false,
      reloadDelay: 200
    };
  }

  componentWillUpdate(nextProps, nextState) {
    // TODO[matteo]: see if this comment is still true.
    //  This code remains unchanged from upstream for now. Something like it
    //  is needed for the conversation view.

    // When we send a message that changes the contact status,
    // then if parent.refreshData is called, then props.contactsPreview
    // will return a new list with the last contact removed and
    // presumably our currentContactIndex will be off.
    // In fact, without the code below, we will 'double-jump' each message
    // we send or change the status in some way.
    // Below, we update our index with the contact that matches our current index.

    if (nextState.currentContactIndex !== this.state.currentContactIndex) {
      console.log(
        "updateindex <cur> <next>",
        this.state.currentContactIndex,
        nextState.currentContactIndex
      );
    }
    const diffContactList =
      (nextProps.contactsPreview[nextState.currentContactIndex] || {}).id !==
        (this.props.contactsPreview[nextState.currentContactIndex] || {}).id ||
      nextProps.contactsPreview.length !== this.props.contactsPreview.length;
    if (diffContactList) {
      console.log(
        "update contactsPreview <cur> <next>",
        this.state.currentContactIndex,
        nextState.currentContactIndex,
        this.props.contactsPreview,
        nextProps.contactsPreview
      );
    }
    if (
      typeof nextState.currentContactIndex !== "undefined" &&
      nextState.currentContactIndex === this.state.currentContactIndex &&
      diffContactList
    ) {
      if (this.props.contactsPreview[this.state.currentContactIndex]) {
        // If we have a contact, then find it in the new list
        const curId = this.props.contactsPreview[this.state.currentContactIndex]
          .id;
        const nextIndex = nextProps.contactsPreview.findIndex(
          c => c.id === curId
        );
        if (nextIndex !== nextState.currentContactIndex) {
          // console.log('changingIndex on update <cur><next><curId><curList><nextList>',
          //             nextState.currentContactIndex, nextIndex,
          //             curId,
          //             this.props.contactsPreview, nextProps.contactsPreview)
          // eslint-disable-next-line no-param-reassign
          nextState.currentContactIndex = Math.max(nextIndex, 0);
          // nextIndex can be -1 if not found, and in that case, we should defer to the front
        }
      } else if (
        this.state.currentContactIndex >= this.props.contactsPreview.length
      ) {
        // If our contactsPreview data isn't available then we should just go to the beginning
        // This pathological situation happens during dynamic assignment sometimes
        nextState.currentContactIndex = 0;
      }
    }
  }

  getContact(contactsPreview, index) {
    if (contactsPreview.length > index) {
      return contactsPreview[index];
    }
    return null;
  }

  incrementCurrentContactIndex = increment => {
    let newIndex = this.state.currentContactIndex;
    newIndex = newIndex + increment;
    this.updateCurrentContactIndex(newIndex);
  };

  updateCurrentContactIndex(newIndex) {
    const updateState = {
      currentContactIndex: newIndex
    };
    this.setState(updateState);
  }

  onSelectConversation = contactId => {
    const { contactsPreview } = this.props;
    const newActiveContact = contactsPreview.find(
      contact => contact.id === contactId
    );
    const newIndex = contactsPreview.indexOf(newActiveContact);
    return this.updateCurrentContactIndex(newIndex);
  };

  hasNext() {
    return this.state.currentContactIndex < this.contactCount() - 1;
  }

  handleAdvanceContact = () => {
    // Always advance, reaching the end of the contact list is handled
    // in render()
    this.incrementCurrentContactIndex(1);
  };

  exitTexter = () => {
    this.props.router.push("/app/" + (this.props.organizationId || ""));
  };

  canRequestBatch() {
    const dynamicAssignments = _.get(
      this.props,
      "assignment.campaign.useDynamicAssignment"
    );
    const onLastContact =
      this.state.currentContactIndex === this.contactCount();
    return this.props.initialSendMode && dynamicAssignments && onLastContact;
  }

  contactCount() {
    const { contactsPreview } = this.props;
    return contactsPreview.length;
  }

  currentContact() {
    const { contactsPreview } = this.props;
    // If the index has got out of sync with the contactsPreview available, then rewind to the start
    if (typeof this.state.currentContactIndex !== "undefined") {
      return this.getContact(contactsPreview, this.state.currentContactIndex);
    }

    this.updateCurrentContactIndex(0);
    return this.getContact(contactsPreview, 0);
  }

  renderTexter() {
    const { assignment } = this.props;
    const { campaign, texter } = assignment;

    const contact = this.currentContact();

    if (!contact || !contact.id) {
      return <LoadingIndicator />;
    }

    return (
      <AssignmentTexterContact
        key={contact.id}
        assignment={assignment}
        contactId={contact.id}
        texter={texter}
        campaign={campaign}
        contactsRemaining={
          this.props.contactsPreview.length - this.state.currentContactIndex
        }
        advanceContact={this.handleAdvanceContact}
        refreshData={this.props.refreshData}
        onExitTexter={this.exitTexter}
        forceDisabledDisplayIfNotSendable={false}
        onSelectConversation={this.onSelectConversation}
        conversationList={this.props.contactsPreview}
      />
    );
  }

  renderBatchButton() {
    return (
      <RaisedButton
        onTouchTap={async () => {
          this.setState({
            loading: true
          });
          const received = await this.props.requestBatch();
          if (!received) {
            // TODO: show some feedback that there are no more contacts
            this.exitTexter();
          }
          this.setState({
            loading: false,
            currentContactIndex: 0
          });
        }}
        label="Request a Batch!"
      />
    );
  }

  renderEmpty() {
    // TODO: style me!
    return (
      <div>
        <Empty
          title="You have nothing left to do."
          icon={<Check />}
          content={
            <div>
              {!this.canRequestBatch() ? (
                ""
              ) : (
                <div>
                  {this.renderBatchButton()}
                  <br />
                  OR:
                </div>
              )}
              <RaisedButton label="Back To Todos" onClick={this.exitTexter} />
            </div>
          }
        />
      </div>
    );
  }

  render() {
    const shouldRenderEmpty =
      this.contactCount() === 0 || this.canRequestBatch();
    return (
      <div className={css(styles.container)}>
        {shouldRenderEmpty ? this.renderEmpty() : this.renderTexter()}
      </div>
    );
  }
}

AssignmentTexter.propTypes = {
  assignment: PropTypes.object, // current assignment
  contactsPreview: PropTypes.array, // contacts for current assignment, rendered in sidebar
  allContactsCount: PropTypes.number,
  router: PropTypes.object,
  refreshData: PropTypes.func,
  requestBatch: PropTypes.func,
  organizationId: PropTypes.string,
  initialSendMode: PropTypes.bool
};

export default withRouter(AssignmentTexter);
