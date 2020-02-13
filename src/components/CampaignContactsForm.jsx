import type from "prop-types";
import React from "react";
import RaisedButton from "material-ui/RaisedButton";
import GSForm from "../components/forms/GSForm";
import Form from "react-formal";
import Subheader from "material-ui/Subheader";
import Divider from "material-ui/Divider";
import { ListItem, List } from "material-ui/List";
import { parseCSV } from "../lib";
import CampaignFormSectionHeading from "./CampaignFormSectionHeading";
import CheckIcon from "material-ui/svg-icons/action/check-circle";
import WarningIcon from "material-ui/svg-icons/alert/warning";
import ErrorIcon from "material-ui/svg-icons/alert/error";
import theme from "../styles/theme";
import { StyleSheet, css } from "aphrodite";
import yup from "yup";
import { dataTest } from "../lib/attributes";

const checkIcon = <CheckIcon color={theme.colors.EWnavy} />;
const warningIcon = <WarningIcon color={theme.colors.EWred} />;
const errorIcon = <ErrorIcon color={theme.colors.EWred} />;

const innerStyles = {
  button: {
    margin: "24px 5px 24px 0",
    fontSize: "10px"
  },
  nestedItem: {
    fontSize: "12px"
  }
};

const styles = StyleSheet.create({
  csvHeader: {
    fontFamily: "Courier",
    backgroundColor: theme.colors.lightGray,
    padding: 3
  },
  exampleImageInput: {
    cursor: "pointer",
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    left: 0,
    width: "100%",
    opacity: 0
  }
});

export default class CampaignContactsForm extends React.Component {
  renderContactStats() {
    const { customFields, contactsCount } = this.props.formValues;

    if (contactsCount === 0) {
      return "";
    }
    return (
      <List>
        <Subheader>Uploaded</Subheader>
        <ListItem
          {...dataTest("uploadedContacts")}
          primaryText={`${contactsCount} contacts`}
          leftIcon={checkIcon}
        />
        <ListItem
          primaryText={`${customFields.length} custom fields`}
          leftIcon={checkIcon}
          nestedItems={customFields.map((field, index) => (
            <ListItem
              key={index}
              innerDivStyle={innerStyles.nestedItem}
              primaryText={field}
            />
          ))}
        />
      </List>
    );
  }

  render() {
    return (
      <div>
        <CampaignFormSectionHeading title="Who are you contacting?" />
        {this.renderContactStats()}
        <RaisedButton primary onClick={this.props.onSubmit} label="Continue" />
      </div>
    );
  }
}

CampaignContactsForm.propTypes = {
  formValues: type.object,
  onSubmit: type.func
};
