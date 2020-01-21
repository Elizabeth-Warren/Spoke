import PropTypes from "prop-types";
import React from "react";
import DisplayLink from "./DisplayLink";

const ConversationLink = ({ conversation, organizationId, text }) => {
  let baseUrl = "http://base";
  if (typeof window !== "undefined") {
    baseUrl = window.location.origin;
  }

  const { assignmentId, campaignContactId } = conversation;

  const url = `${baseUrl}/app/${organizationId}/todos/${assignmentId}/review/${campaignContactId}`;

  return <DisplayLink url={url} textContent={text} />;
};

ConversationLink.propTypes = {
  text: PropTypes.string,
  organizationId: PropTypes.string,
  conversation: PropTypes.object
};

export default ConversationLink;
