import PropTypes from "prop-types";
import React from "react";
import { List, ListItem } from "material-ui/List";
import { StyleSheet, css } from "aphrodite";
import theme from "src/styles/theme";
import classNames from "classnames";

const styles = StyleSheet.create({
  listWrapper: {
    position: "relative"
  },
  listItem: {
    position: "absolute",
    width: "100%",
    color: "white",
    transition: "top 0.25s",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    ":hover": {
      backgroundColor: "rgba(240, 242, 240, .1)"
    }
  },
  listItemActive: {
    backgroundColor: "rgba(240, 242, 240, .1)"
  },
  icon: {
    backgroundColor: theme.colors.EWlibertyGreen,
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

export default class ConversationList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      script: props.script
    };
  }

  render() {
    const { conversations = [], onSelectConversation } = this.props;

    const listItems = conversations.map((convo, i) => {
      const { messageStatus, id, firstName, lastName } = convo;
      const isCurrent = this.props.currentContactId === id;
      const name = `${firstName} ${lastName}`;
      const needsMessage = messageStatus === "needsResponse";
      return (
        <ListItem
          value={name}
          onTouchTap={() => onSelectConversation(convo)}
          key={id}
          style={{ top: `${i * 48}px` }}
          className={classNames(css(styles.listItem), {
            [css(styles.listItemActive)]: isCurrent
          })}
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

    return <div className={css(styles.listWrapper)}>{list}</div>;
  }
}

ConversationList.propTypes = {
  conversation: PropTypes.object,
  conversations: PropTypes.arrayOf(PropTypes.object),
  onSelectConversation: PropTypes.func,
  currentContactId: PropTypes.string
};
