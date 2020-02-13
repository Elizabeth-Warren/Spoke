import type from "prop-types";
import React from "react";
import { Tabs, Tab } from "material-ui";
import ConversationList from "./ConversationList";
import theme from "../styles/theme";
import { StyleSheet, css } from "aphrodite";

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: theme.colors.EWlibertyGreen,
    height: "100%"
  },
  componentWrapper: {
    height: "calc(100% - 60px)"
  }
});

class ConversationsMenu extends React.Component {
  constructor(props) {
    super(props);
    const { conversations, currentContact } = this.props;
    const initialContact = conversations.find(
      item => item.id === currentContact
    );
    const tab =
      initialContact && initialContact.messageStatus === "closed"
        ? "skipped"
        : "active";
    this.state = { tab };
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
    const { onSelectConversation } = this.props;
    onSelectConversation(convo);
  };

  renderConversations({ conversations, currentContact }) {
    const displayedConversations =
      this.state.tab === "active"
        ? conversations.filter(item => item.messageStatus !== "closed")
        : conversations.filter(item => item.messageStatus === "closed");
    return (
      <ConversationList
        currentContact={currentContact}
        conversations={displayedConversations}
        onSelectConversation={this.handleSelectConversation}
      />
    );
  }

  render() {
    const { conversations, currentContact } = this.props;
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
          {this.renderConversations({ conversations, currentContact })}
        </div>
      </div>
    );
  }
}

ConversationsMenu.propTypes = {
  conversations: type.array,
  onSelectConversation: type.func,
  currentContact: type.string
};

export default ConversationsMenu;
