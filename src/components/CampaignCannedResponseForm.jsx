import type from "prop-types";
import React from "react";
import { StyleSheet, css } from "aphrodite";
import yup from "yup";
import GSForm from "./forms/GSForm";
import Form from "react-formal";
import FlatButton from "material-ui/FlatButton";
import { dataTest } from "../lib/attributes";

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
      surveyQuestion: this.props.initialSurveyQuestion
    };
  }
  handleSave = formValues => {
    const { onSaveCannedResponse } = this.props;
    onSaveCannedResponse(formValues);
  };

  render() {
    const modelSchema = yup.object({
      title: yup.string().required(),
      text: yup.string().required(),
      surveyQuestion: yup.string().nullable()
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
          <Form.Field
            {...dataTest("surveyQuestion")}
            name="surveyQuestion"
            fullWidth
            label="Survey Question"
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
  intitialSurveyQuestion: type.string,
  submitLabel: type.string.isRequired
};

export default CannedResponseForm;
