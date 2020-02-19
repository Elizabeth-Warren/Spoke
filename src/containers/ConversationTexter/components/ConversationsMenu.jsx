import type from "prop-types";
import React from "react";
import { Tabs, Tab } from "material-ui";
import ConversationList from "./ConversationList";
import { StyleSheet, css } from "aphrodite";

const styles = StyleSheet.create({
  wrapper: {
    height: "100%"
  },
  componentWrapper: {
    height: "calc(100% - 60px)"
  }
});

class ConversationsMenu extends React.Component {
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
      </div>
    );
  }
}

ConversationsMenu.propTypes = {
  conversations: type.array,
  onSelectContact: type.func,
  currentContactId: type.string
};

export default ConversationsMenu;
