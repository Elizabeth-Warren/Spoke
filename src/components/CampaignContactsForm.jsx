import type from "prop-types";
import React from "react";
import humps from "humps";
import RaisedButton from "material-ui/RaisedButton";
import Subheader from "material-ui/Subheader";
import { ListItem, List } from "material-ui/List";
import CampaignFormSectionHeading from "./CampaignFormSectionHeading";
import CheckIcon from "material-ui/svg-icons/action/check-circle";
import theme from "../styles/theme";
import { StyleSheet, css } from "aphrodite";
import { dataTest } from "../lib/attributes";
import {
  Table,
  TableBody,
  TableHeader,
  TableHeaderColumn,
  TableRow,
  TableRowColumn
} from "material-ui/Table";
import { inputNameForColumn } from "src/lib/fields-helpers";

const fieldsToSkip = ["customFields", "id", "__typename"];

const checkIcon = <CheckIcon color={theme.colors.EWnavy} />;

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
  getColumnHeaders(columns) {
    return (
      <TableHeader adjustForCheckbox={false} displaySelectAll={false}>
        <TableRow>
          {columns.map(col => (
            <TableHeaderColumn>{inputNameForColumn(col)}</TableHeaderColumn>
          ))}
        </TableRow>
      </TableHeader>
    );
  }

  getCellValues(contact, columns) {
    const contactCustomFields = JSON.parse(contact.customFields);
    return columns.map(col => (
      <TableRowColumn>
        {contact[col] || contactCustomFields[col]}
      </TableRowColumn>
    ));
  }

  getContactRows(contacts, columns) {
    return contacts.map(contact => (
      <TableRow>{this.getCellValues(contact, columns)}</TableRow>
    ));
  }

  contactsGrid() {
    const {
      customFields = [],
      contactsCount,
      contactsPreview: contacts
    } = this.props.formValues;
    if (contactsCount === 0) {
      return "";
    }
    const columns = [...Object.keys(contacts[0]), ...customFields].filter(
      col => !fieldsToSkip.includes(col)
    ); //camel to snake
    return (
      <Table
        bodyStyle={{ overflow: "auto" }}
        style={{ width: "auto", overflow: "auto" }}
        fixedHeader={false}
      >
        {this.getColumnHeaders(columns)}
        <TableBody displayRowCheckbox={false}>
          {this.getContactRows(contacts, columns)}
        </TableBody>
      </Table>
    );
  }

  renderContactStats() {
    const { customFields = [], contactsCount } = this.props.formValues;
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
          nestedItems={[[this.contactsGrid()]]}
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
    const { contactFileName = "file name" } = this.props.formValues;
    return (
      <div>
        <CampaignFormSectionHeading title="Who are you contacting?" />
        Uploaded from file: <b>{contactFileName}</b>
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
