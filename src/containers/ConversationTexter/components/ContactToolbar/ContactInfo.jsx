import PropTypes from "prop-types";
import React from "react";
import { StyleSheet, css } from "aphrodite";
import _ from "lodash";

import ActionInfoOutline from "material-ui/svg-icons/action/info-outline";
import Dialog from "material-ui/Dialog";
import FlatButton from "material-ui/FlatButton";
import ProhibitedIcon from "material-ui/svg-icons/av/not-interested";
import IconButton from "material-ui/IconButton";
import theme from "src/styles/theme";
import ClearIcon from "material-ui/svg-icons/content/clear";

import ConversationLink from "src/components/ConversationLink";

const styles = StyleSheet.create({
  container: {
    display: "flex",
    flexDirection: "column"
  },
  addSpace: {
    paddingTop: "25px"
  },
  button: {
    width: 28,
    minWidth: 28,
    minHeight: 28,
    height: 28,
    paddingTop: 2,
    marginTop: 3,
    marginLeft: 20
  },
  optOutButton: {
    height: 33,
    width: 33,
    borderRadius: 6,
    boxSizing: "border-box",
    padding: 3,
    backgroundColor: theme.colors.EWred
  }
});

export default class ContactInfo extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      open: false
    };
  }

  dialogActions = (
    <FlatButton
      label="Close"
      primary
      onClick={() => this.handleCloseDialog()}
    />
  );

  handleCloseDialog = () => {
    this.setState({ open: false });
  };

  handleOpenDialog = () => {
    this.setState({ open: true });
  };

  renderButton = () => (
    <FlatButton className={css(styles.button)} onClick={this.handleOpenDialog}>
      <ActionInfoOutline color="white" />
    </FlatButton>
  );

  renderOptOutButton = () => (
    <IconButton
      className={css(styles.optOutButton)}
      onClick={this.props.onClickOptOut}
      tooltip="Opt Out"
      iconStyle={{ fill: theme.colors.white }}
    >
      <ProhibitedIcon />
    </IconButton>
  );

  renderDialog = () => (
    <Dialog
      title="Conversation Information"
      open={this.state.open}
      actions={this.dialogActions}
      modal
    >
      <div className={css(styles.container)}>
        <span>
          <a
            href="https://sites.google.com/elizabethwarren.com/warren-for-president-textteam/home"
            target="_blank"
          >
            Text Team Help
          </a>
        </span>
        <span className={css(styles.addSpace)}>
          Campaign: {this.props.campaign.id} {this.props.campaign.title}
        </span>
        <span>Texter: {this.props.assignment.texter.displayName}</span>
        <span>
          Contact: {this.props.campaignContact.id}{" "}
          {this.props.campaignContact.firstName}
        </span>
        <div className={css(styles.addSpace)}>
          <ConversationLink
            campaignId={this.props.campaign.id}
            organizationId={this.props.campaign.organization.id}
            conversation={{
              assignmentId: this.props.campaignContact.assignmentId,
              campaignContactId: this.props.campaignContact.id
            }}
            text="Conversation URL"
            isOptedOut={!!_.get(this.props.campaignContact, "optOut.id", false)}
          />
        </div>
      </div>
    </Dialog>
  );

  render = () => (
    <div>
      {this.props.onClickOptOut ? this.renderOptOutButton() : null}
      {this.renderButton()}
      {this.state.open && this.renderDialog()}
    </div>
  );
}

ContactInfo.propTypes = {
  open: PropTypes.bool,
  campaign: PropTypes.object,
  campaignContact: PropTypes.object,
  assignment: PropTypes.object,
  onClickOptOut: PropTypes.func
};
