import React from "react";
import PropTypes from "prop-types";
import Dialog from "material-ui/Dialog";
import FlatButton from "material-ui/FlatButton";
import CampaignStatusSelect from "./CampaignStatusSelect";
import { CampaignStatus } from "../lib/campaign-statuses";
import ActionInfoOutline from "material-ui/svg-icons/action/info-outline";
import theme from "../styles/theme";
import WarningIcon from "material-ui/svg-icons/alert/warning";
import { TextField } from "material-ui";

const {
  ACTIVE,
  CLOSED,
  CLOSED_FOR_INITIAL_SENDS,
  ARCHIVED,
  NOT_STARTED
} = CampaignStatus;

const descriptions = {
  ACTIVE: "Campaign is running. All texts can be sent.  LFG.",
  CLOSED:
    "Campaign is no longer running. Texters will not be able to send any texts - initial or mid-conversation. Useful for putting a campaign on pause while you edit or closing a campaign that you might want to reactivate.",
  CLOSED_FOR_INITIAL_SENDS:
    "Campaign is still running, but Texters will not be able to send initial outbound texts. Useful for closing Campaigns inviting contacts to a past event or pausing a campaign while the initial outbound message needs to be edited.",
  ARCHIVED:
    "Campaign is no longer running. Texters will not be able to see the campaign or send any texts - initial or mid-conversation. You will not be able to reactive an archived campaign. The messaging service associated with the campaign will be destroyed. If at any point you would like this campaign back, choose Closed for all texts instead."
};

const styles = {
  dialog: {
    width: 500
  },
  iconStyle: { marginRight: 5, height: 18 },
  statusInfoStyle: {
    display: "flex",
    marginBottom: 40,
    fontSize: 13,
    alignItems: "center"
  },
  archiveConfirmation: {
    width: "100%",
    backgroundColor: theme.colors.veryLightGray,
    borderRadius: 6,
    padding: "20px 20px 10px 20px",
    boxSizing: "border-box"
  },
  archiveConfirmHeader: {
    fontSize: 20,
    marginBottom: 10,
    marginTop: 0,
    textAlign: "center",
    fontWeight: "bold",
    color: theme.colors.EWnavy
  },
  archiveConfirmContent: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center"
  },
  largeWarningIcon: { height: 75, width: 75, marginRight: 20 }
};
class CampaignStatusModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      archiveText: ""
    };
  }
  renderArchiveConfirmation() {
    return (
      <div style={styles.archiveConfirmation}>
        <h2 style={styles.archiveConfirmHeader}>
          Are you sure? This is permanent!
        </h2>
        <div style={styles.archiveConfirmContent}>
          <div>
            <WarningIcon
              style={styles.largeWarningIcon}
              color={theme.colors.EWred}
            />
          </div>
          <div>
            <span style={{ color: theme.colors.EWnavy }}>
              Type DELETE to confirm
            </span>
            <div>
              <TextField
                hintText="DELETE"
                value={this.state.archiveText}
                onChange={e => {
                  this.setState({ archiveText: e.target.value });
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  handleSaveChange = () => {
    const { campaignStatus } = this.props;
    const { archiveText } = this.state;
    const isArchive = campaignStatus === ARCHIVED;
    const typedArchive = archiveText === "DELETE";
    const validated = isArchive ? typedArchive : true;
    if (validated) {
      this.props.handleSave();
    }
  };

  render() {
    const {
      campaignIdForStatusChange,
      campaignStatus,
      handleCloseModal,
      handleChangeStatus
    } = this.props;

    const warningColor =
      campaignStatus === ARCHIVED ? theme.colors.EWred : theme.colors.EWnavy;
    const statusDescription = descriptions[campaignStatus];

    const statusDropdownOptions =
      campaignStatus === NOT_STARTED
        ? [ARCHIVED]
        : [ACTIVE, CLOSED_FOR_INITIAL_SENDS, CLOSED, ARCHIVED];

    return (
      <Dialog
        contentStyle={styles.dialog}
        title="Change Campaign Status"
        open={!!campaignIdForStatusChange}
        actions={[
          <FlatButton label="Save" onClick={this.handleSaveChange} />,
          <FlatButton label="Close" onClick={handleCloseModal} />
        ]}
        modal
        open={open}
        onRequestClose={handleCloseModal}
      >
        <CampaignStatusSelect
          value={campaignStatus}
          onChange={handleChangeStatus}
          statusOptions={statusDropdownOptions}
        />
        <div>
          <span style={{ color: warningColor, ...styles.statusInfoStyle }}>
            <div>
              {statusDescription && (
                <ActionInfoOutline
                  style={styles.iconStyle}
                  color={warningColor}
                />
              )}
            </div>
            <div>{statusDescription}</div>
          </span>
          {campaignStatus === ARCHIVED && this.renderArchiveConfirmation()}
        </div>
      </Dialog>
    );
  }
}

CampaignStatusModal.propTypes = {
  campaignIdForStatusChange: PropTypes.string,
  campaignStatus: PropTypes.string,
  handleCloseModal: PropTypes.func,
  handleChangeStatus: PropTypes.func,
  handleSave: PropTypes.func
};

export default CampaignStatusModal;
