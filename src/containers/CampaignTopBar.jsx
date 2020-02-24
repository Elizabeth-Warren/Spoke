import { withRouter } from "react-router";
import { StyleSheet, css } from "aphrodite";
import React from "react";
import types from "prop-types";

import { Toolbar, ToolbarGroup, ToolbarTitle } from "material-ui";
import NavigateHomeIcon from "material-ui/svg-icons/action/home";
import IconButton from "material-ui/IconButton/IconButton";

import theme from "src/styles/theme";

const styles = StyleSheet.create({
  campaignToolbar: {
    height: "48px",
    backgroundColor: theme.colors.EWnavy,
    borderBottom: `1px solid ${theme.colors.white}`
  },

  campaignName: {
    color: theme.colors.white,
    fontSize: "15px",
    maxWidth: "calc(100vw - 150px)",
    overflowX: "hidden",
    opacity: 0.7,
    cursor: "pointer",
    ":hover": {
      opacity: 1
    }
  }
});

function CampaignTopBar({ campaign, organizationId, assignmentId, router }) {
  return (
    <Toolbar className={css(styles.campaignToolbar)}>
      <ToolbarGroup firstChild={true}>
        <IconButton
          onClick={() => {
            router.push(`/app/${organizationId}/todos`);
          }}
          tooltip="Return Home"
          tooltipPosition="bottom-right"
          iconStyle={{ fill: theme.colors.white }}
        >
          <NavigateHomeIcon color="rgb(255,255,255)" />
        </IconButton>
        <ToolbarTitle
          text={campaign.title}
          className={css(styles.campaignName)}
          onClick={() => {
            router.push(
              `/app/${organizationId}/todos/${assignmentId}/overview`
            );
          }}
        />
      </ToolbarGroup>
    </Toolbar>
  );
}

CampaignTopBar.propTypes = {
  campaign: types.object.isRequired,
  organizationId: types.string.isRequired,
  router: types.object.isRequired
};

export default withRouter(CampaignTopBar);
