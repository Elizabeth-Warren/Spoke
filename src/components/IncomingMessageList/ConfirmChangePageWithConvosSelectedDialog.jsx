import React, { Component } from "react";

import type from "prop-types";
import Dialog from "material-ui/Dialog";
import FlatButton from "material-ui/FlatButton";

const nextOrPrevious = pageDelta => (pageDelta > 0 ? "next" : "previous");

const ConfirmChangePageWithConvosSelectedDialog = props => (
  <Dialog
    title="Change page with conversations selected?"
    actions={[
      <FlatButton
        label={`Move to the ${nextOrPrevious(props.pageDelta)} page`}
        secondary
        onClick={() => props.onRequestClose(true)}
      />,
      <FlatButton
        label="Stay on this page"
        primary
        onClick={() => props.onRequestClose(false)}
      />
    ]}
    modal
    open={props.open}
  >
    {`There are conversations selected on this page. Move to the ${nextOrPrevious(
      props.pageDelta
    )} page and clear all selections?`}
  </Dialog>
);

ConfirmChangePageWithConvosSelectedDialog.propTypes = {
  open: type.bool.isRequired,
  pageDelta: type.number.isRequired,
  onRequestClose: type.func.isRequired
};

export default ConfirmChangePageWithConvosSelectedDialog;
