import React from "react";
import PropTypes from "prop-types";
import FlatButton from "material-ui/FlatButton";
import { Dialog } from "material-ui";

const styles = {
  dialog: {
    width: 400
  }
};
function ConfirmCampaignArchiveModal(props) {
  const { open, onClose, onHandleArchive, confirmationText } = props;
  const modalText = confirmationText || "Click OK to archive this campaign.";

  return (
    <Dialog
      contentStyle={styles.dialog}
      title="Archive Campaign?"
      open={open}
      actions={[
        <FlatButton secondary label="Cancel" onClick={onClose} />,
        <FlatButton
          label="OK"
          primary
          keyboardFocused
          onClick={onHandleArchive}
        />
      ]}
      onRequestClose={onClose}
    >
      {modalText}
    </Dialog>
  );
}

ConfirmCampaignArchiveModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  onHandleArchive: PropTypes.func
};

export default ConfirmCampaignArchiveModal;
