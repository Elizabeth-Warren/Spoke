import React, { Component } from "react";
import PropTypes from "prop-types";
import { StyleSheet, css } from "aphrodite";
import { blue900 } from "material-ui/styles/colors";
import moment from "moment";
import theme from "../styles/theme";

// https://www.twilio.com/docs/sms/accepted-mime-types
const supportedFileTypes = [
  "image/jpeg",
  "image/gif",
  "image/png",
  "image/bmp"
];
const isSupportedFileType = fileType => supportedFileTypes.includes(fileType);

const styles = StyleSheet.create({
  conversationRow: {
    padding: "10px",
    borderRadius: "5px",
    whiteSpace: "pre-line",

    fontWeight: "normal"
  },
  fromContact: {
    marginLeft: "10px",
    marginRight: "50px",
    alignSelf: "flex-start",
    textAlign: "left",
    backgroundColor: theme.colors.EWnavy,
    color: theme.colors.EWlightLibertyGreen,
    position: "relative",

    ":before": {
      content: "' '",
      height: 0,
      position: "absolute",
      width: 0,
      left: -25,
      border: "14px solid transparent",
      borderRightColor: theme.colors.EWnavy,
      zIndex: 10,
      top: "calc(50% - 14px)"
    }
  },
  fromTexter: {
    marginRight: "10px",
    marginLeft: "50px",
    alignSelf: "flex-end",
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
  },
  showAttachmentLink: {
    color: blue900,
    textDecoration: "underline",
    cursor: "pointer"
  }
});
class Message extends Component {
  constructor(props) {
    super(props);
  }

  state = {
    showAttachments: {}
  };

  render() {
    const { index, message } = this.props;
    const isFromContact = message.isFromContact;
    let itemStyle = null;
    itemStyle = isFromContact ? styles.fromContact : styles.fromTexter;

    let attachments = [];
    if (message.attachments) {
      attachments = JSON.parse(message.attachments);
    }

    const { showAttachments } = this.state;

    return (
      <p key={index} className={css(styles.conversationRow, itemStyle)}>
        {message.text}
        <br />
        {attachments
          .map((attachment, i) => [
            <span>
              <a
                as="button"
                href={
                  isSupportedFileType(attachment.contentType)
                    ? null
                    : attachment.url
                }
                className={css(styles.showAttachmentLink)}
                onClick={() => {
                  const current = showAttachments[i];
                  const update = Object.assign({}, showAttachments, {
                    [i]: !current
                  });
                  this.setState({
                    showAttachments: update
                  });
                }}
              >
                Attachment: {attachment.contentType}
              </a>
              {showAttachments[i] &&
                isSupportedFileType(attachment.contentType) && (
                  <img
                    style={{ maxWidth: 400, marginTop: 10 }}
                    src={attachment.url}
                  ></img>
                )}
            </span>,
            <br />
          ])
          .flat()}
        <span className={css(styles.when)}>
          {moment(message.createdAt).fromNow()}
        </span>
      </p>
    );
  }
}

Message.propTypes = {
  message: PropTypes.object,
  index: PropTypes.number
};

export default Message;
