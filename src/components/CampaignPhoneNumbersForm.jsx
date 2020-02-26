import React from "react";
import type from "prop-types";
import { StyleSheet, css } from "aphrodite";
import GSForm from "../components/forms/GSForm";
import yup from "yup";
import Form from "react-formal";
import CampaignFormSectionHeading from "../components/CampaignFormSectionHeading";
import { ListItem, List } from "material-ui/List";
import { dataSourceItem } from "../components/utils";
import AutoComplete from "material-ui/AutoComplete";
import IconButton from "material-ui/IconButton/IconButton";
import DeleteIcon from "material-ui/svg-icons/action/delete";
import theme from "../styles/theme";
import { dataTest } from "../lib/attributes";
import FlatButton from "material-ui/FlatButton";
import moment from "moment";

const maxNumbersPerCampaign = 400;
const maxAreaCodesPerCampaign = 3;

const styles = StyleSheet.create({
  container: {
    border: `1px solid ${theme.colors.lightGray}`,
    padding: 10,
    borderRadius: 8
  },
  removeButton: {
    width: 50
  },
  headerContainer: {
    display: "flex",
    alignItems: "center",
    borderBottom: `1px solid ${theme.colors.lightGray}`,
    marginBottom: 20,
    padding: "10px 0px"
  },
  input: {
    width: 50,
    paddingLeft: 0,
    paddingRight: 0,
    marginRight: 10,
    marginTop: "auto",
    marginBottom: "auto",
    display: "inline-block"
  },
  errorMessage: {
    margin: "10px 0px",
    color: theme.colors.EWred
  }
});

const inlineStyles = {
  autocomplete: {
    marginBottom: 24
  },
  header: {
    ...theme.text.header
  }
};

const message = `
  Select what area code you'd like to use for your campaign. Please contact
  the tech team if there aren't enough number in our inventory.
 `;
export default class CampaignPhoneNumbersForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      searchText: "",
      error: ""
    };
  }

  formSchema = yup.object({
    areaCode: yup.string(), // TODO: validate
    count: yup.number()
  });

  formValues() {
    return {
      ...this.props.formValues,
      phoneNumbers: this.props.formValues.phoneNumbers
    };
  }

  getTotalNumberCount = numbers =>
    numbers.reduce((acc, entry) => (acc = acc + entry.count), 0);

  showSearch() {
    const { availablePhoneNumbers, contactsCount } = this.props;
    const { phoneNumbers } = this.formValues();

    const dataSource = availablePhoneNumbers
      .filter(
        numbersForAreaCode =>
          !phoneNumbers.find(
            reservedNumber =>
              reservedNumber.areaCode === numbersForAreaCode.areaCode
          )
      )
      .map(numbersForAreaCode =>
        dataSourceItem(numbersForAreaCode.areaCode, numbersForAreaCode.areaCode)
      );

    const filter = (searchText, key) =>
      key === "allphoneNumbers"
        ? true
        : AutoComplete.caseInsensitiveFilter(searchText, key);
    const campaignStarted = this.props.isStarted;
    const autocomplete = (
      <AutoComplete
        ref="autocomplete"
        style={inlineStyles.autocomplete}
        autoFocus
        onFocus={() => this.setState({ searchText: "" })}
        onUpdateInput={searchText => this.setState({ searchText })}
        searchText={this.state.searchText}
        filter={filter}
        hintText="Area Code"
        name="areaCode"
        label="Area Code"
        dataSource={dataSource}
        onNewRequest={value => {
          if (typeof value === "object") {
            const assignedNumberCount = this.getTotalNumberCount(phoneNumbers);

            if (phoneNumbers.length === maxAreaCodesPerCampaign) {
              this.setState({
                error: `Only ${maxAreaCodesPerCampaign} area codes per campaign allowed! Please remove one and try again.`
              });
              return;
            }
            const numbersNeeded = Math.ceil(
              contactsCount / window.CONTACTS_PER_PHONE_NUMBER
            );
            const remainingNeeded = numbersNeeded - assignedNumberCount;
            const areaCode = value.value.key;
            const newAreaCode = availablePhoneNumbers.find(
              number => number.areaCode === areaCode
            );
            const availForAreaCode = newAreaCode.count;
            const numberToReserve =
              remainingNeeded >= availForAreaCode
                ? availForAreaCode
                : remainingNeeded;

            this.props.onChange({
              phoneNumbers: [
                ...this.formValues().phoneNumbers,
                {
                  areaCode: newAreaCode.areaCode,
                  count: numberToReserve
                }
              ]
            });
          }
          this.setState({ searchText: "", error: "" });
        }}
      />
    );
    const showAutocomplete =
      !campaignStarted && availablePhoneNumbers.length > 0;
    return <div>{showAutocomplete ? autocomplete : ""}</div>;
  }

  getNumbersCount = count => (count === 1 ? "number" : "numbers");
  formatTimeRemaining = dateTime => {
    const expiration = moment(dateTime).add(1, "days");
    return moment(expiration).fromNow();
  };

  showPhoneNumbers() {
    const {
      formValues: { phoneNumbers }
    } = this.props;
    const { availablePhoneNumbers } = this.props;
    const getAvailableCount = areaCode => {
      const remaining = availablePhoneNumbers.find(
        item => item.areaCode === areaCode
      );
      return (remaining && remaining.count) || 0;
    };

    return (
      <List>
        {phoneNumbers.map((item, index) => (
          <ListItem
            primaryText={item.areaCode}
            secondaryTextLines={2}
            secondaryText={
              <div>
                <div>{`Using ${item.count} ${this.getNumbersCount(
                  item.count
                )} (${getAvailableCount(item.areaCode)} available)`}</div>
                <div>{`Expires ${this.formatTimeRemaining(
                  item.reservedAt
                )}`}</div>
              </div>
            }
            {...dataTest("areaCodeRow")}
            key={item.areaCode}
            rightIconButton={
              !this.props.isStarted && (
                <IconButton
                  onClick={async () => {
                    const currentFormValues = this.formValues();
                    const newFormValues = {
                      ...currentFormValues
                    };
                    newFormValues.phoneNumbers = newFormValues.phoneNumbers.slice();
                    newFormValues.phoneNumbers.splice(index, 1);
                    this.props.onChange(newFormValues);
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              )
            }
          />
        ))}
      </List>
    );
  }

  renderErrorMessage() {
    const { error } = this.state;
    return <div className={css(styles.errorMessage)}>{error}</div>;
  }

  areaCodeTable() {
    const { phoneNumbers: reservedNumbers } = this.formValues();
    const assignedNumberCount = this.getTotalNumberCount(reservedNumbers);
    const { contactsCount } = this.props;
    const numbersNeeded = Math.ceil(
      contactsCount / window.CONTACTS_PER_PHONE_NUMBER
    );

    const headerColor =
      assignedNumberCount === numbersNeeded
        ? theme.colors.EWnavy
        : theme.colors.EWred;

    return (
      <div className={css(styles.container)}>
        <div className={css(styles.headerContainer)}>
          <div
            style={{
              ...inlineStyles.header,
              color: headerColor,
              flex: "1 1 50%"
            }}
          >
            {`Reserved phone numbers: ${assignedNumberCount}/${numbersNeeded}`}
          </div>
          <div>
            <FlatButton
              label="Re-Reserve All"
              disabled={!this.props.isStarted || !reservedNumbers.length}
              onClick={() => {
                this.props.onSubmit({ reservedNumbers });
              }}
              type="submit"
            />
          </div>
        </div>
        {this.showPhoneNumbers()}
      </div>
    );
  }

  render() {
    return (
      <GSForm
        schema={this.formSchema}
        value={this.formValues()}
        onChange={this.props.onChange}
        onSubmit={val => {
          const { phoneNumbers } = this.formValues();
          const assignedNumberCount = this.getTotalNumberCount(phoneNumbers);
          if (assignedNumberCount >= maxNumbersPerCampaign) {
            this.setState({
              error: `Only ${maxNumbersPerCampaign} numbers can be reserved for a single campaign. Please remove some and try again!`
            });
            return;
          }
          this.props.onSubmit();
        }}
      >
        <CampaignFormSectionHeading title="Phone Numbers" subtitle={message} />
        <div>
          {this.showSearch()}
          {this.state.error && this.renderErrorMessage()}
          {this.areaCodeTable()}
          <Form.Button
            type="submit"
            disabled={this.props.saveDisabled}
            label={this.props.saveLabel}
          />
        </div>
      </GSForm>
    );
  }
}

CampaignPhoneNumbersForm.propTypes = {
  formValues: type.object,
  onChange: type.func,
  customFields: type.array,
  saveLabel: type.string,
  availablePhoneNumbers: type.array,
  contactsCount: type.number,
  onSubmit: type.func,
  saveDisabled: type.bool
};
