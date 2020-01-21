import React, { Component } from "react";
import PropTypes from "prop-types";
import Message from "./Message";
import Tag from "./Tag";

export default class MessageList extends Component {
  componentDidMount() {
    this.refs.messageWindow.scrollTo(0, this.refs.messageWindow.scrollHeight);
  }

  componentDidUpdate() {
    this.refs.messageWindow.scrollTo(0, this.refs.messageWindow.scrollHeight);
  }

  render() {
    const { messages, tags } = this.props;
    const items = [...messages, ...tags];
    const sortedItems = items.sort(
      (left, right) => Date.parse(left.createdAt) - Date.parse(right.createdAt)
    );
    return (
      <div
        ref="messageWindow"
        style={{ maxHeight: "300px", overflowY: "scroll" }}
      >
        {sortedItems.map((item, index) =>
          !item.tag ? (
            <Message message={item} key={index} />
          ) : (
            <Tag tag={item} key={index} />
          )
        )}
      </div>
    );
  }
}

MessageList.propTypes = {
  messages: PropTypes.arrayOf(PropTypes.object),
  tags: PropTypes.arrayOf(PropTypes.object)
};
