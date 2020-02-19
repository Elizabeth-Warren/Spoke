import PropTypes from "prop-types";
import React from "react";

import { Toolbar, ToolbarGroup, ToolbarTitle } from "material-ui/Toolbar";
import NavigateHomeIcon from "material-ui/svg-icons/action/home";
import IconButton from "material-ui/IconButton/IconButton";

import { getLocalTime, getContactTimezone } from "src/lib/timezones";
import { getProcessEnvDstReferenceTimezone } from "src/lib/tz-helpers";
import theme from "src/styles/theme";

import ContactInfo from "./ContactInfo";
import { withRouter } from "react-router";

const inlineStyles = {
  toolbar: {
    backgroundColor: theme.colors.EWnavy
  },
  cellToolbarTitle: {
    color: theme.colors.white,
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

function localTimeForContact(campaign, campaignContact) {
  const { location } = campaignContact;

  let city = "";
  let state = "";
  let timezone = null;
  let offset = 0;
  let hasDST = false;

  if (location) {
    city = location.city;
    state = location.state;
    timezone = location.timezone;
    if (timezone) {
      offset = timezone.offset || offset;
      hasDST = timezone.hasDST || hasDST;
    }
    const adjustedLocationTZ = getContactTimezone(campaign, location);
    if (adjustedLocationTZ && adjustedLocationTZ.timezone) {
      offset = adjustedLocationTZ.timezone.offset;
      hasDST = adjustedLocationTZ.timezone.hasDST;
    }
  }

  let formattedLocation = `${city}`;
  if (city && state) {
    formattedLocation = `${formattedLocation}, `;
  }
  formattedLocation = `${formattedLocation} ${state}`;

  const dstReferenceTimezone = campaign.overrideOrganizationTextingHours
    ? campaign.timezone
    : getProcessEnvDstReferenceTimezone();

  return getLocalTime(offset, hasDST, dstReferenceTimezone).format("LT"); // format('h:mm a')
}

function ContactToolbar({ campaign, campaignContact, assignment, router }) {
  const localTime = campaignContact
    ? localTimeForContact(campaign, campaignContact)
    : "";
  const contactName = campaignContact ? campaignContact.firstName : "";

  return (
    <div>
      <Toolbar style={inlineStyles.toolbar}>
        <ToolbarGroup style={inlineStyles.group}>
          <ToolbarTitle
            text={contactName}
            style={inlineStyles.cellToolbarTitle}
          />
          <ToolbarTitle style={inlineStyles.cellToolbarTitle} />
          <ToolbarTitle
            style={inlineStyles.timeToolbarTitle}
            text={localTime}
          />
          <IconButton
            onTouchTap={() => {
              router.push(`/app/${campaign.organization.id}/todos`);
            }}
            style={inlineStyles.exitTexterIconButton}
            tooltip="Return Home"
            tooltipPosition="bottom-center"
          >
            <NavigateHomeIcon color="rgb(255,255,255)" />
          </IconButton>
        </ToolbarGroup>
        <ToolbarGroup>
          {campaignContact && (
            <ContactInfo
              campaign={campaign}
              campaignContact={campaignContact}
              assignment={assignment}
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
