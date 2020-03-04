import React from "react";

import { Toolbar, ToolbarGroup, ToolbarTitle } from "material-ui";
import NavigateHomeIcon from "material-ui/svg-icons/action/home";
import IconButton from "material-ui/IconButton/IconButton";

import PropTypes from "prop-types";
import _ from "lodash";
import { withRouter } from "react-router";
import FlatButton from "material-ui/FlatButton";
import Dialog from "material-ui/Dialog";

export const FIVE_MIN_TO_CLOSED = "FIVE_MIN_TO_CLOSED";
export const ALMOST_CLOSED = "ALMOST_CLOSED";
export const OUTSIDE_HOURS = "OUTSIDE_HOURS";
export const CAMPAIGN_CLOSED = "CAMPAIGN_CLOSED";

const customContentStyle = {
  width: "42%"
};

function TextingClosedModal({ errorStatus, onClickDialog, open }) {
  function getModalMessage() {
    let title;
    switch (errorStatus) {
      case OUTSIDE_HOURS:
        title = "It's outside of texting hours for this campaign.";
        break;
      case CAMPAIGN_CLOSED:
        title = "This campaign is closed for texting at this time.";
        break;
      case FIVE_MIN_TO_CLOSED:
        title = "Texting hours end in 5 minutes.";
        break;
      case ALMOST_CLOSED:
        title = "Texting hours close in a few minutes.";
        break;

      default:
        title = "This campaign is closed for texting at this time.";
        break;
    }
    return title;
  }

  const almostClosed =
    errorStatus === FIVE_MIN_TO_CLOSED || errorStatus === ALMOST_CLOSED;

  const defaultContent = (
    <div
      style={{
        display: "flex",
        flexDirection: "row"
      }}
    >
      <div>
        <div style={{ marginRight: 10 }}>
          We're redirecting you to the texter dashboard. <p />
        </div>
        See you later!
      </div>
    </div>
  );

  const almostClosedContent = (
    <div>Please wrap up any active conversations for the day. Thanks!</div>
  );

  const modalContent = almostClosed ? almostClosedContent : defaultContent;

  return (
    <Dialog
      title={getModalMessage()}
      actions={[<FlatButton label="Ok" primary onClick={onClickDialog} />]}
      open={open}
      modal
      contentStyle={customContentStyle}
    >
      {modalContent}
    </Dialog>
  );
}

TextingClosedModal.propTypes = {
  errorStatus: PropTypes.string,
  open: PropTypes.bool,
  onClickDialog: PropTypes.func
};

export default withRouter(TextingClosedModal);
