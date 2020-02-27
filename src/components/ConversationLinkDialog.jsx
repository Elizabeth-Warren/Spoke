import React from "react";
import PropTypes from "prop-types";

import Dialog from "material-ui/Dialog";
import ConversationLink from "../components/ConversationLink";
import FlatButton from "material-ui/FlatButton";
import { dataTest } from "../lib/attributes";

const ConversationLinkDialog = props => (
  <Dialog
    title="Link To This Conversation"
    actions={[
      <FlatButton
        {...dataTest("convoLinkOK")}
        label="OK"
        primary
        onClick={props.requestClose}
      />
    ]}
    modal={false}
    open={props.open}
    onRequestClose={props.requestClose}
  >
    <ConversationLink
      campaignId={props.campaignId}
      organizationId={props.organizationId}
      conversation={props.conversation}
      text={props.text}
      isOptedOut={props.isOptedOut}
    />
  </Dialog>
);

ConversationLinkDialog.propTypes = {
  open: PropTypes.bool,
  requestClose: PropTypes.func,
  conversation: PropTypes.object,
  campaignId: PropTypes.string,
  organizationId: PropTypes.string,
  text: PropTypes.string
};

export default ConversationLinkDialog;
