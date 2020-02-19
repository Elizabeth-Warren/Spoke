import PropTypes from "prop-types";
import React, { Component } from "react";
import { StyleSheet, css } from "aphrodite";
import moment from "moment";

import { List, ListItem } from "material-ui/List";
import ProhibitedIcon from "material-ui/svg-icons/av/not-interested";
import Divider from "material-ui/Divider";
import { red300 } from "material-ui/styles/colors";

import Message from "src/components/Message";

const LOCK_TO_BOTTOM_THRESHOLD_PX = 5;

const styles = StyleSheet.create({
  optOut: {
    fontSize: "13px",
    fontStyle: "italic"
  },
  scrollWrapper: {
    flex: "1 1 auto",
    overflowY: "scroll",
    overflow: "-moz-scrollbars-vertical"
  }
});

class MessageList extends Component {
  static propTypes = {
    contact: PropTypes.object
  };

  constructor(props) {
    super(props);

    this.isLockedToBottom = true;
  }

  componentDidMount() {
    this.scrollToBottom();
  }

  componentDidUpdate(prevProps) {
    if (
      this.isLockedToBottom ||
      prevProps.contact.id !== this.props.contact.id
    ) {
      this.scrollToBottom();
    }
  }

  scrollToBottom = () => {
    const el = this.scrollWrapper;
    el.scrollTop = el.scrollHeight;
    this.isLockedToBottom = true;
  };

  handleScroll = evt => {
    const el = evt.target;

    // We store as a property on the component rather than in the state
    // because we *don't* want to trigger a re-render when we change this,
    // or we'd jump to the bottom when we get within the 3px threshold

    // Based on: https://stackoverflow.com/a/42860948
    this.isLockedToBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight <
      LOCK_TO_BOTTOM_THRESHOLD_PX;
  };

  render() {
    const { contact } = this.props;
    const { optOut, messages } = contact;

    const optOutItem = optOut ? (
      <div>
        <Divider />
        <ListItem
          className={css(styles.optOut)}
          leftIcon={<ProhibitedIcon style={{ fill: red300 }} />}
          disabled
          primaryText={`${contact.firstName} opted out of texts`}
          secondaryText={moment(optOut.createdAt).fromNow()}
        />
      </div>
    ) : (
      ""
    );

    return (
      <div
        className={css(styles.scrollWrapper)}
        ref={el => {
          this.scrollWrapper = el;
        }}
        onScroll={this.handleScroll}
      >
        <List
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "10px"
          }}
        >
          {messages.map((message, index) => (
            <Message key={index} message={message} />
          ))}
          {optOutItem}
        </List>
      </div>
    );
  }
}

export default MessageList;
