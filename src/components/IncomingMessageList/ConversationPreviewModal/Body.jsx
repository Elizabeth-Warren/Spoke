import React, { Component } from 'react'
import PropTypes from 'prop-types'
import MessageResponse from './MessageResponse'
import MessageList from './MessageList'

export default class ConversationPreviewBody extends Component {
  constructor(props) {
    super(props)

    this.state = {
      messages: props.conversation.messages
    }

    this.messagesChanged = this.messagesChanged.bind(this)
  }

  messagesChanged(messages) {
    this.setState({ messages })
  }

  render() {
    return (
      <div>
        <MessageList
          messages={this.state.messages}
          tags={this.props.conversation.tags}
        />
        <MessageResponse
          conversation={this.props.conversation}
          messagesChanged={this.messagesChanged}
        />
      </div>
    )
  }
}

ConversationPreviewBody.propTypes = {
  conversation: PropTypes.object
}
