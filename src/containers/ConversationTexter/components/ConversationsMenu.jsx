import types from "prop-types";
import React from "react";
import { Tabs, Tab } from "material-ui";
import ConversationList from "./ConversationList";
import { StyleSheet, css } from "aphrodite";
import RequestBatchButton from "src/containers/RequestBatchButton";

const styles = StyleSheet.create({
  wrapper: {
    height: "100%",
    display: "flex",
    flexDirection: "column"
  },
  componentWrapper: {
    flex: "1",
    overflowY: "auto"
  },
  rebatchWrapper: {
    margin: "20px",
    textAlign: "center"
  },
  rebatchImage: {
    width: "150px",
    height: "150px"
  },
  rebatchHeader: {
    fontFamily: "Ringside Compressed A",
    textTransform: "uppercase"
  }
});

class ConversationsMenu extends React.Component {
  static propTypes = {
    conversations: types.array,
    onSelectContact: types.func,
    currentContactId: types.string,

    organizationId: types.string.isRequired,
    assignmentId: types.string.isRequired,
    moreBatchesAvailable: types.bool.isRequired,
    unsentInitialCount: types.number.isRequired
  };

  constructor(props) {
    super(props);
    const { conversations, currentContactId } = this.props;
    const initialContact = conversations.find(
      item => item.id === currentContactId
    );
    const tab =
      initialContact && initialContact.messageStatus === "closed"
        ? "skipped"
        : "active";
    this.state = { tab };
  }

  componentWillReceiveProps(newProps) {
    // If the selected contact went from being closed to being
    // active, then switch back to the active tab
    if (newProps.currentContactId === this.props.currentContactId) {
      const contactId = newProps.currentContactId;

      const prevContact = this.props.conversations.find(
        item => item.id === contactId
      );
      const newContact = newProps.conversations.find(
        item => item.id === contactId
      );

      if (
        prevContact &&
        newContact &&
        prevContact.messageStatus === "closed" &&
        newContact.messageStatus !== "closed"
      ) {
        this.setState({ tab: "active" });
      }
    }
  }

  getTabs() {
    const tabs = [
      {
        name: "active",
        label: "Active"
      },
      {
        name: "skipped",
        label: "Skipped"
      }
    ];
    return tabs;
  }

  handleSelectConversation = convo => {
    const { onSelectContact } = this.props;
    onSelectContact(convo.id);
  };

  renderConversations({ conversations, currentContactId }) {
    const displayedConversations =
      this.state.tab === "active"
        ? conversations.filter(item => item.messageStatus !== "closed")
        : conversations.filter(item => item.messageStatus === "closed");
    return (
      <ConversationList
        currentContactId={currentContactId}
        conversations={displayedConversations}
        onSelectConversation={this.handleSelectConversation}
      />
    );
  }

  renderBatchRequestIfAvailable() {
    const {
      moreBatchesAvailable,
      unsentInitialCount,
      organizationId,
      assignmentId,
      conversations
    } = this.props;

    const visible =
      this.state.tab === "active" &&
      !conversations.find(c => c.messageStatus === "needsResponse");

    if (moreBatchesAvailable) {
      return (
        <div
          className={css(styles.rebatchWrapper)}
          style={visible ? {} : { display: "none" }}
        >
          <img
            src="https://ew-spoke-public.s3.amazonaws.com/bailey-circle.png"
            className={css(styles.rebatchImage)}
            alt="Bailey Warren"
          />
          <h2 className={css(styles.rebatchHeader)}>Great Job!</h2>
          <p>
            You've replied to all your messages, but there's more texts to send!
            Can Elizabeth and Bailey count on you to send another batch?
          </p>
          <RequestBatchButton
            organizationId={organizationId}
            assignmentId={assignmentId}
            buttonLabel="LFG"
            unsentCount={unsentInitialCount}
            secondary
          />
        </div>
      );
    } else {
      return (
        <div
          className={css(styles.rebatchWrapper)}
          style={visible ? {} : { display: "none" }}
        >
          <img
            src="https://ew-spoke-public.s3.amazonaws.com/ew-circle.png"
            className={css(styles.rebatchImage)}
            alt="Bailey Warren"
          />
          <h2 className={css(styles.rebatchHeader)}>Wow!</h2>
          <p>
            You've replied to all your messages, and there's no more batches to
            send for this campaign! Keep an eye on this page for replies, and
            check back in on the Slack for more campaigns.
          </p>
        </div>
      );
    }
  }

  render() {
    const { conversations, currentContactId } = this.props;
    const tabs = this.getTabs();

    return (
      <div className={css(styles.wrapper)}>
        <Tabs
          value={this.state.tab}
          onChange={newVal => {
            this.setState({ tab: newVal });
          }}
        >
          {tabs.map(tab => (
            <Tab key={tab.name} value={tab.name} label={tab.label} />
          ))}
        </Tabs>
        <div className={css(styles.componentWrapper)}>
          {this.renderConversations({ conversations, currentContactId })}
        </div>
        {this.renderBatchRequestIfAvailable()}
      </div>
    );
  }
}

export default ConversationsMenu;
