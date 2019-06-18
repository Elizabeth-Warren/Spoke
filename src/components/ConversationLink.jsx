import PropTypes from 'prop-types'
import React from 'react'
import DisplayLink from './DisplayLink'

const ConversationLink = ({ conversation, organizationId }) => {
  let baseUrl = 'http://base'
  if (typeof window !== 'undefined') {
    baseUrl = window.location.origin
  }

  const { assignmentId, campaignContactId } = conversation

  const url = `${baseUrl}/app/${organizationId}/todos/${assignmentId}/review/${campaignContactId}`

  const textContent = "Copy this link and send it to somone you want to look at this conversation.  The texter to whom it's currently assigned and any user who is at least a supervolunteer will be able to see the conversation."

  return (
    <DisplayLink url={url} textContent={textContent} />
  )
}

ConversationLink.propTypes = {
  organizationId: PropTypes.string,
  conversation: PropTypes.object
}

export default ConversationLink
