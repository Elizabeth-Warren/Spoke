import PropTypes from "prop-types";
import React from "react";

import { Toolbar, ToolbarGroup, ToolbarTitle } from "material-ui/Toolbar";

import theme from "src/styles/theme";

import ContactInfo from "./ContactInfo";
import { withRouter } from "react-router";

const inlineStyles = {
  toolbar: {
    backgroundColor: theme.colors.EWnavy,
    height: "48px"
  },
  cellToolbarTitle: {
    color: theme.colors.EWlightLibertyGreen,
    fontSize: 20
  },
  locationToolbarTitle: {
    color: theme.colors.white,
    fontSize: "1em"
  },
  timeToolbarTitle: {
    color: theme.colors.white,
    fontSize: "1em"
  }
};

function ContactToolbar({
  campaign,
  campaignContact,
  assignment,
  router,
  onClickOptOut
}) {
  const contactName = campaignContact ? campaignContact.firstName : "";

  return (
    <div>
      <Toolbar style={inlineStyles.toolbar}>
        <ToolbarGroup />
        <ToolbarGroup style={inlineStyles.group}>
          <ToolbarTitle
            text={contactName}
            style={inlineStyles.cellToolbarTitle}
          />
        </ToolbarGroup>
        <ToolbarGroup>
          {campaignContact && (
            <ContactInfo
              campaign={campaign}
              campaignContact={campaignContact}
              assignment={assignment}
              onClickOptOut={onClickOptOut}
            />
          )}
        </ToolbarGroup>
      </Toolbar>
    </div>
  );
}

ContactToolbar.propTypes = {
  campaignContact: PropTypes.object,
  campaign: PropTypes.object,
  assignment: PropTypes.object,
  router: PropTypes.object
};

export default withRouter(ContactToolbar);
