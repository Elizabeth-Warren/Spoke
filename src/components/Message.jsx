import React, { Component } from "react";
import PropTypes from "prop-types";
import { blue900 } from "material-ui/styles/colors";
import moment from "moment";
import theme from "../styles/theme";
import { StyleSheet as Aphrodite } from "aphrodite";

const isEven = value => value % 2 == 0;
const getHref = string =>
  string.toLowerCase().startsWith("http") ? string : `//${string}`;

const { StyleSheet, css } = Aphrodite.extend([
  {
    selectorHandler: (selector, baseSelector, generateSubtreeStyles) => {
      if (selector[0] === ">") {
        const tag = selector.slice(1);
        const nestedTag = generateSubtreeStyles(`${baseSelector} ${tag}`);
        return nestedTag;
      }
      return null;
    }
  }
]);

function createTextLinks_(text) {
  return (text || "").replace(
    /([^\S]|^)(((https?\:\/\/)|(www\.))(\S+))/gi,
    (match, space, url) => {
      let hyperlink = url;
      if (!hyperlink.match("^https?://")) {
        hyperlink = "http://" + hyperlink;
      }
      return space + '<a href="' + hyperlink + '">' + url + "</a>";
    }
  );
}

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
    wordBreak: "break-word",
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
    "> a": {
      color: theme.colors.lightYellow
    },
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
    const messageSplitByLink = message.text.split(
      /(?:[^\S]|^)((?:(?:https?\:\/\/)|(?:www\.))(?:\S+))/gi
    );

    return (
      <p key={index} className={css(styles.conversationRow, itemStyle)}>
        {messageSplitByLink.map((string, index) => {
          const isLink = !isEven(index);
          return isLink ? (
            <a target="_blank" href={getHref(string)}>
              {string}
            </a>
          ) : (
            string
          );
        })}
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
