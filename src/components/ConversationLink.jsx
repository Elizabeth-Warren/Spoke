import PropTypes from "prop-types";
import React from "react";
import DisplayLink from "./DisplayLink";

const ConversationLink = ({
  conversation,
  organizationId,
  text,
  campaignId,
  isOptedOut = false
}) => {
  let baseUrl = "http://base";
  if (typeof window !== "undefined") {
    baseUrl = window.location.origin;
  }
  const { campaignContactId, contactNumber } = conversation;

  const url = `${baseUrl}/admin/${organizationId}/campaigns/${campaignId}/review?contactId=${campaignContactId}&optedOut=${isOptedOut}${
    contactNumber ? `&cell=${encodeURIComponent(contactNumber)}` : ""
  }`;

  return <DisplayLink url={url} textContent={text} />;
};

ConversationLink.propTypes = {
  campaignId: PropTypes.string,
  text: PropTypes.string,
  organizationId: PropTypes.string,
  conversation: PropTypes.object
};

export default ConversationLink;
