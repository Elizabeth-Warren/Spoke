import types from "prop-types";
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
    border: `6px solid ${theme.colors.EWlibertyGreen}`,
    backgroundColor: "white",
    borderRadius: "50%",
    height: 6,
    width: 6,
    display: "inline-block",
    marginRight: 10
  },
  itemRow: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center"
  },
  contactName: {
    whiteSpace: "initial",
    wordWrap: "break-word",
    maxWidth: "90%",
    color: theme.colors.EWlightLibertyGreen
  },
  noIcon: {
    paddingLeft: 22
  }
});

export default function ConversationList(props) {
  const { conversations = [], onSelectConversation, currentContactId } = props;

  const listItems = conversations.map((convo, i) => {
    const { messageStatus, id, firstName, lastName } = convo;
    const isCurrent = currentContactId === id;
    const name = `${firstName} ${lastName}`;
    const needsMessage = messageStatus === "needsResponse";
    return (
      <ListItem
        value={name}
        onClick={() => onSelectConversation(convo)}
        key={id}
        style={{ top: `${i * 48}px` }}
        className={classNames(css(styles.listItem), {
          [css(styles.listItemActive)]: isCurrent
        })}
      >
        <div className={css(styles.itemRow)}>
          {needsMessage && <div className={css(styles.icon)} />}
          <div
            className={
              needsMessage
                ? css(styles.contactName)
                : css(styles.contactName, styles.noIcon)
            }
          >
            {name}
          </div>
        </div>
      </ListItem>
    );
  });

  const list = conversations.length === 0 ? null : <List>{listItems}</List>;

  return <div className={css(styles.listWrapper)}>{list}</div>;
}

ConversationList.propTypes = {
  conversations: types.arrayOf(types.object).isRequired,
  onSelectConversation: types.func.isRequired,
  currentContactId: types.string
};
