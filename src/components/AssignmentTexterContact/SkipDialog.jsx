import PropTypes from "prop-types";
import React from "react";
import FlatButton from "material-ui/FlatButton";
import { Card, CardActions, CardTitle } from "material-ui/Card";
import Divider from "material-ui/Divider";
import { StyleSheet, css } from "aphrodite";
import DropDownMenu, { MenuItem } from "material-ui/DropDownMenu";
import TextField from "material-ui/TextField";
import { TAGS, NO_TAG } from "../../lib/tags";
import theme from "../../styles/theme";

const styles = StyleSheet.create({
  skipCard: {
    "@media(max-width: 320px)": {
      padding: "2px 10px !important"
    },
    zIndex: 2000,
    backgroundColor: "white",
    display: "flex",
    flexDirection: "column"
  },
  inputFields: {
    display: "flex",
    flexDirection: "row",
    width: "100%"
  },
  tag: {
    width: "250px",
    minWidth: "250px"
  },
  comment: {
    flexGrow: 1,
    minWidth: "50%"
  },
  dialogActions: {
    marginTop: 20,
    display: "flex",
    flexDirection: "row",
    justifyContent: "flex-end"
  }
});

const inlineStyles = {
  dialogButton: {
    display: "inline-block"
  },
  dropdownIconStyle: {
    fill: theme.colors.EWnavy
  }
};

const skipButtonLabel = tag =>
  !!tag && tag !== NO_TAG.value ? "Skip" : "Skip without tag";

const SkipDialog = props =>
  props.open && (
    <Card>
      <CardTitle className={css(styles.skipCard)} title="Skip conversation" />
      <Divider />
      <CardActions className={css(styles.skipCard)}>
        <div className={css(styles.skipCard)}>
          <div className={css(styles.inputFields)}>
            <DropDownMenu
              className={css(styles.tag)}
              iconStyle={inlineStyles.dropdownIconStyle}
              anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
              autoWidth={false}
              onChange={(event, key, value) => props.onTagChanged(value)}
              value={props.tag || NO_TAG.value}
            >
              {[NO_TAG, ...Object.values(TAGS)].map(tag => (
                <MenuItem
                  key={tag.value}
                  value={tag.value}
                  primaryText={tag.display}
                />
              ))}
            </DropDownMenu>
            {props.tag && props.tag !== NO_TAG.value && (
              <TextField
                className={css(styles.comment)}
                hintText="Enter an optional comment"
                onChange={(event, value) => props.onSkipCommentChanged(value)}
              />
            )}
          </div>
          <div className={css(styles.dialogActions)}>
            <FlatButton
              style={inlineStyles.dialogButton}
              label="Cancel"
              onTouchTap={props.onRequestClose}
              secondary
            />
            <FlatButton
              style={inlineStyles.dialogButton}
              label={skipButtonLabel(props.tag)}
              disabled={props.disabled}
              onTouchTap={() => {
                props.onRequestClose();
                props.onSkip();
              }}
            />
          </div>
        </div>
      </CardActions>
    </Card>
  );

SkipDialog.propTypes = {
  tag: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  comment: PropTypes.string,
  open: PropTypes.bool,
  disabled: PropTypes.bool,
  onRequestClose: PropTypes.func,
  onRequestOpen: PropTypes.func,
  onSkip: PropTypes.func,
  onTagChanged: PropTypes.func,
  onSkipCommentChanged: PropTypes.func
};

export default SkipDialog;
