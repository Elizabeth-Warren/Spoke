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
    color: theme.colors.white
  },
  fromTexter: {
    marginRight: "10px",
    marginLeft: "50px",
    alignSelf: "flex-end",
    textAlign: "right",
    backgroundColor: theme.colors.EWlibertyGreen,
    color: theme.colors.EWnavy
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

  return (
    <p key={index} className={css(styles.conversationRow, itemStyle)}>
      {message.text}
      <br />
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
