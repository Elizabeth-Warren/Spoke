import React, { Component } from "react";
import PropTypes from "prop-types";

import { StyleSheet, css } from "aphrodite";

import moment from "moment";

import theme from "../styles/theme";
const styles = StyleSheet.create({
  conversationRow: {
    padding: "10px",
    borderRadius: "5px",
    fontWeight: "normal"
  },
  fromContact: {
    marginLeft: "10px",
    marginRight: "50px",
    alignSelf: "flex-start",
    textAlign: "left",
    backgroundColor: theme.colors.gray,
    color: theme.colors.white,
    position: "relative",

    ":before": {
      content: "' '",
      height: 0,
      position: "absolute",
      width: 0,
      left: -25,
      border: "14px solid transparent",
      borderRightColor: theme.colors.gray,
      zIndex: 10,
      top: "calc(50% - 14px)"
    }
  },
  fromTexter: {
    marginRight: "10px",
    marginLeft: "50px",
    alignSelf: "flex-end",
    textAlign: "right",
    backgroundColor: theme.colors.EWlibertyGreen,
    color: theme.colors.EWnavy,
    position: "relative",

    ":before": {
      content: "' '",
      height: 0,
      position: "absolute",
      width: 0,
      right: -25,
      border: "14px solid transparent",
      borderLeftColor: theme.colors.EWlibertyGreen,
      zIndex: 10,
      top: "calc(50% - 14px)"
    }
  },
  when: {
    fontSize: theme.text.body.fontSize - 2
  }
});

const Message = props => {
  const { index, message } = props;
  const isFromContact = message.isFromContact;
  let itemStyle = null;
  itemStyle = isFromContact ? styles.fromContact : styles.fromTexter;

  let attachments = [];
  if (message.attachments) {
    attachments = JSON.parse(message.attachments);
  }

  return (
    <p key={index} className={css(styles.conversationRow, itemStyle)}>
      {message.text}
      <br />
      {attachments
        .map(attachment => [
          <span>
            <a href={attachment.url} target="_blank">
              Attachment: {attachment.contentType}
            </a>
          </span>,
          <br />
        ])
        .flat()}
      <span className={css(styles.when)}>
        {moment(message.createdAt).fromNow()}
      </span>
    </p>
  );
};

Message.propTypes = {
  message: PropTypes.object,
  index: PropTypes.number
};

export default Message;
