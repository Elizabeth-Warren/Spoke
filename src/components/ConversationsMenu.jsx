import type from "prop-types";
import React from "react";
import { List } from "material-ui/List";
import { ToolbarTitle } from "material-ui/Toolbar";
import ConversationList from "./ConversationList";
import theme from "../styles/theme";

const styles = {
  title: {
    color: theme.colors.white,
    paddingLeft: 16
  }
};

class ConversationsMenu extends React.Component {
  constructor(props) {
    super(props);
  }

  handleSelectConversation = convo => {
    const { onSelectConversation } = this.props;
    onSelectConversation(convo);
  };

  renderConversations({ conversations, subheader }) {
    return (
      <ConversationList
        conversations={conversations}
        onSelectConversation={this.handleSelectConversation}
      />
    );
  }

  render() {
    const { conversations } = this.props;

    return (
      <List>
        <ToolbarTitle text="Conversations" style={styles.title} />
        {this.renderConversations({ conversations })}
      </List>
    );
  }
}

ConversationsMenu.propTypes = {
  conversations: type.array,
  onSelectConversation: type.func
};

export default ConversationsMenu;
