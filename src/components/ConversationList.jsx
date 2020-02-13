import PropTypes from "prop-types";
import React from "react";
import { List, ListItem } from "material-ui/List";
import { StyleSheet, css } from "aphrodite";
import theme from "../styles/theme";

const styles = StyleSheet.create({
  listItem: {
    ":hover": {
      backgroundColor: "rgba(240, 242, 240, .1)"
    }
  },
  listItemActive: {
    backgroundColor: "rgba(240, 242, 240, .1)"
  },
  icon: {
    backgroundColor: theme.colors.EWnavy,
    borderRadius: "50%",
    height: 12,
    width: 12,
    display: "inline-block",
    marginRight: 10
  },
  itemRow: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center"
  },
  noIcon: {
    paddingLeft: 22
  }
});

export default class ScriptList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      script: props.script
    };
  }

  render() {
    const { conversations = [], onSelectConversation } = this.props;

    const listItems = conversations.map(convo => {
      const { messageStatus, id, firstName, lastName } = convo;
      const isCurrent = this.props.currentContact === id;
      const name = `${firstName} ${lastName}`;
      const needsMessage = messageStatus === "needsResponse";
      return (
        <ListItem
          value={name}
          onTouchTap={() => onSelectConversation(convo.id)}
          key={id}
          style={styles.listItem}
          className={css(isCurrent ? styles.listItemActive : styles.listItem)}
        >
          <div className={css(styles.itemRow)}>
            {needsMessage && <div className={css(styles.icon)} />}
            <span className={needsMessage ? null : css(styles.noIcon)}>
              {name}
            </span>
          </div>
        </ListItem>
      );
    });

    const list = conversations.length === 0 ? null : <List>{listItems}</List>;

    return <div>{list}</div>;
  }
}

ScriptList.propTypes = {
  conversation: PropTypes.object,
  conversations: PropTypes.arrayOf(PropTypes.object),
  onSelectConversation: PropTypes.func,
  currentContact: PropTypes.string
};
