import React from "react";
import type from "prop-types";
import SelectField from "material-ui/SelectField";
import MenuItem from "material-ui/MenuItem";
import IconButton from "material-ui/IconButton";
import ClearIcon from "material-ui/svg-icons/content/clear";
import { StyleSheet, css } from "aphrodite";

const styles = StyleSheet.create({
  commas: {
    ":not(:last-child)::after": {
      content: '", "'
    }
  },
  icon: {}
});

export const MESSAGE_STATUSES = {
  all: {
    name: "All",
    children: ["needsResponse", "needsMessage", "convo", "messaged"]
  },
  needsResponse: {
    name: "Needs Texter Response",
    children: []
  },
  needsMessage: {
    name: "Needs First Message",
    children: []
  },
  convo: {
    name: "Active Conversation",
    children: []
  },
  messaged: {
    name: "First Message Sent",
    children: []
  },
  closed: {
    name: "Closed",
    children: []
  }
};

export const MessageStatusFilter = props => (
  <SelectField
    multiple
    value={props.messageFilter}
    hintText={"Which messages?"}
    floatingLabelText={"Contact message status"}
    floatingLabelFixed
    onChange={props.onChange}
    selectionRenderer={(value, menuItems) =>
      menuItems.length ? (
        <div>
          <IconButton
            className={css(styles.icon)}
            onClick={event => {
              event.stopPropagation();
              props.onChange(undefined, undefined, []);
            }}
          >
            <ClearIcon />
          </IconButton>
          {menuItems.map(menuItem => (
            <span className={css(styles.commas)}>
              {menuItem.props.primaryText}
            </span>
          ))}
        </div>
      ) : null
    }
  >
    {Object.keys(MESSAGE_STATUSES).map(messageStatus => {
      const displayText = MESSAGE_STATUSES[messageStatus].name;
      const isChecked =
        props.messageFilter && props.messageFilter.indexOf(messageStatus) > -1;
      return (
        <MenuItem
          key={messageStatus}
          value={messageStatus}
          primaryText={displayText}
          insetChildren
          checked={isChecked}
        />
      );
    })}
  </SelectField>
);

MessageStatusFilter.propTypes = {
  messageFilter: type.array.isRequired,
  onChange: type.func.isRequired
};

export default MessageStatusFilter;
