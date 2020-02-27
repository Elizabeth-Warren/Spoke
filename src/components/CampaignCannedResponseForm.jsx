import type from "prop-types";
import React from "react";
import { StyleSheet, css } from "aphrodite";
import yup from "yup";
import Form from "react-formal";
import { FlatButton, AutoComplete } from "material-ui";
import _ from "lodash";

import { dataTest } from "../lib/attributes";

import GSForm from "./forms/GSForm";
import LabelChips from "./LabelChips";

const styles = StyleSheet.create({
  buttonRow: {
    marginTop: 5
  }
});

class CannedResponseForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      title: this.props.initialTitle,
      text: this.props.initialText,
      labelIds: this.props.initialLabelIds || []
    };
  }

  handleSave = () => {
    const { onSaveCannedResponse } = this.props;
    onSaveCannedResponse(this.state);
  };

  render() {
    const modelSchema = yup.object({
      title: yup.string().required(),
      text: yup.string().required()
    });

    const { customFields } = this.props;
    return (
      <div>
        <GSForm
          ref="form"
          schema={modelSchema}
          onSubmit={this.handleSave}
          value={this.state}
          onChange={v => this.setState(v)}
        >
          <Form.Field
            {...dataTest("title")}
            name="title"
            autoFocus
            fullWidth
            label="Title"
          />
          <Form.Field
            {...dataTest("editorResponse")}
            customFields={customFields}
            name="text"
            type="script"
            label="Script"
            multiLine
            fullWidth
          />
          <AutoComplete
            ref="autocompleteInput"
            floatingLabelText="Add A Label"
            filter={AutoComplete.fuzzyFilter}
            dataSource={this.props.labels.filter(
              l => this.state.labelIds.indexOf(l.id) === -1
            )}
            maxSearchResults={8}
            onNewRequest={({ id }) => {
              this.refs.autocompleteInput.setState({ searchText: "" });
              this.setState(state => ({
                labelIds: state.labelIds.concat(id)
              }));
            }}
            dataSourceConfig={{
              text: "displayValue",
              value: "id"
            }}
          />
          <LabelChips
            labels={this.props.labels}
            labelIds={this.state.labelIds}
            onRequestDelete={label => {
              this.setState(state => ({
                labelIds: _.without(state.labelIds, label.id)
              }));
            }}
          />
          <div className={css(styles.buttonRow)}>
            <Form.Button
              {...dataTest("addResponse")}
              type="submit"
              label={this.props.submitLabel}
              style={{
                display: "inline-block"
              }}
            />
            <FlatButton
              label="Cancel"
              onClick={this.props.closeForm}
              style={{
                marginLeft: 5,
                display: "inline-block"
              }}
            />
          </div>
        </GSForm>
      </div>
    );
  }
}

CannedResponseForm.propTypes = {
  onSaveCannedResponse: type.func,
  customFields: type.array,
  closeForm: type.func,
  initialTitle: type.string,
  initialText: type.string,
  submitLabel: type.string.isRequired,
  initialLabelIds: type.array,
  labels: type.array
};

export default CannedResponseForm;
