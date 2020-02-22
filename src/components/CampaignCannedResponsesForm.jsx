import type from "prop-types";
import React from "react";
import CampaignCannedResponseForm from "./CampaignCannedResponseForm";
import FlatButton from "material-ui/FlatButton";
import Form from "react-formal";
import GSForm from "./forms/GSForm";
import { List, ListItem } from "material-ui/List";
import Subheader from "material-ui/Subheader";
import Divider from "material-ui/Divider";
import CampaignFormSectionHeading from "./CampaignFormSectionHeading";
import DeleteIcon from "material-ui/svg-icons/action/delete";
import IconButton from "material-ui/IconButton";
import yup from "yup";
import CreateIcon from "material-ui/svg-icons/content/create";
import theme from "../styles/theme";
import { StyleSheet, css } from "aphrodite";
import { dataTest } from "../lib/attributes";
import { SortableContainer, SortableElement } from "react-sortable-hoc";
import arrayMove from "array-move";
import { parseResponsesCSV } from "../lib";
import RaisedButton from "material-ui/RaisedButton/RaisedButton";
import CheckIcon from "material-ui/svg-icons/action/check-circle";
import WarningIcon from "material-ui/svg-icons/alert/warning";
import ErrorIcon from "material-ui/svg-icons/alert/error";
import ColumnName from "../containers/AdminCampaignCreate/ColumnName";
import FilePicker from "../containers/AdminCampaignCreate/FilePicker";
import ValidationStats from "../containers/AdminCampaignCreate/ValidationStats";

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
  formContainer: {
    ...theme.layouts.greenBox,
    maxWidth: "100%",
    paddingTop: 10,
    paddingBottom: 10,
    paddingRight: 10,
    paddingLeft: 10,
    marginTop: 15,
    textAlign: "left"
  },
  form: {
    backgroundColor: theme.colors.white,
    padding: 10
  },
  uploadColumnsWrapper: {
    display: "flex",
    flexDirection: "row"
  },
  uploadColumn: {
    flex: "1"
  },
  errorMessage: {
    backgroundColor: theme.colors.red,
    padding: "10px 5px"
  }
});

const requiredColumns = [
  { name: "Body", desc: "response body", type: "required" },
  { name: "Title", desc: "response title", type: "required" }
];

const optionalColumns = [
  { name: "Data Item", desc: "survey question", type: "optional" }
];

export default class CampaignCannedResponsesForm extends React.Component {
  constructor(props) {
    super(props);
  }

  state = {
    state: "idle",
    showAddForm: false,
    currentlyEditing: [],
    fields: null
  };

  formSchema = yup.object({
    cannedResponses: yup.array().of(
      yup.object({
        title: yup.string(),
        text: yup.string(),
        surveyQuestion: yup.string()
      })
    )
  });

  closeAddForm = () => {
    this.setState({
      showAddForm: false
    });
  };

  handleAdd = values => {
    const newResponse = {
      ...values,
      isNew: true,
      id: Math.random()
        .toString(36)
        .replace(/[^a-zA-Z1-9]+/g, "")
    };

    this.props.onChange({
      cannedResponses: this.props.formValues.cannedResponses.concat([
        newResponse
      ])
    });

    this.closeAddForm();
  };

  handleDelete = response => {
    const newVals = this.props.formValues.cannedResponses
      .map(responseToDelete => {
        if (responseToDelete.id === response.id) {
          if (response.isNew) {
            // This response hasn't been saved to the backend --
            // hard-delete it
            return null;
          } else {
            // This response has been saved to the backend --
            // soft-delete it
            return {
              ...responseToDelete,
              deleted: true
            };
          }
        }

        return responseToDelete;
      })
      .filter(ele => ele !== null);

    this.props.onChange({
      cannedResponses: newVals
    });
  };

  stopEditing = responseId => {
    this.setState({
      currentlyEditing: this.state.currentlyEditing.filter(
        id => id !== responseId
      )
    });
  };

  startEditing = responseId => {
    this.setState({
      currentlyEditing: this.state.currentlyEditing.concat([responseId])
    });
  };

  columnIsPresent(name) {
    if (!this.state.fields) {
      return null;
    }

    return this.state.fields.indexOf(name) !== -1;
  }

  handleEdit = (responseId, newData) => {
    const newVals = this.props.formValues.cannedResponses.map(
      responseToEdit => {
        if (responseToEdit.id === responseId) {
          return {
            ...responseToEdit,
            ...newData
          };
        }

        return responseToEdit;
      }
    );

    this.props.onChange({
      cannedResponses: newVals
    });

    this.stopEditing(responseId);
  };

  handleSort = ({ oldIndex, newIndex }) => {
    // oldIndex and newIndex are indices into the *filtered* set of responses, so we
    // have to look at just the active responses, perform the reordering operation on those,
    // and then add back in the deleted responses.

    const [deletedResponses, activeResponses] = _.partition(
      this.props.formValues.cannedResponses,
      "deleted"
    );

    arrayMove.mutate(activeResponses, oldIndex, newIndex);

    this.props.onChange({
      cannedResponses: activeResponses.concat(deletedResponses)
    });
  };

  showUploadButton() {
    const { responseUploadError } = this.state;

    return (
      <div>
        <h3>Upload CSV</h3>
        {responseUploadError && (
          <div className={css(styles.errorMessage)}>{responseUploadError}</div>
        )}

        <div className={css(styles.uploadColumnsWrapper)}>
          <div className={css(styles.uploadColumn)}>
            <h4>Required Columns</h4>
            <div>
              {requiredColumns.map(c => (
                <ColumnName
                  key={c.name}
                  {...c}
                  present={this.columnIsPresent(c.name)}
                />
              ))}
            </div>
            <h4>Optional Columns</h4>
            <div>
              {optionalColumns.map(c => (
                <ColumnName
                  key={c.name}
                  {...c}
                  present={this.columnIsPresent(c.name)}
                />
              ))}
            </div>
          </div>
          {(this.state.state === "idle" ||
            this.state.state === "uploading") && (
            <FilePicker onPick={this.handleUpload} />
          )}

          {(this.state.state === "parsed" ||
            this.state.state === "uploading") && (
            <ValidationStats
              stats={this.state.validationStats}
              canDelete={this.state.state === "parsed"}
              onDelete={this.onDelete}
              nResponses={this.state.responses && this.state.responses.length}
            />
          )}
        </div>
      </div>
    );
  }

  showAddForm() {
    if (this.state.showAddForm) {
      return (
        <div className={css(styles.formContainer)}>
          <div className={css(styles.form)}>
            <CampaignCannedResponseForm
              submitLabel="Add Response"
              onSaveCannedResponse={this.handleAdd}
              customFields={this.props.customFields}
              closeForm={this.closeAddForm}
            />
          </div>
        </div>
      );
    }
    return (
      <FlatButton
        {...dataTest("newCannedResponse")}
        secondary
        label="Add new canned response"
        icon={<CreateIcon />}
        onTouchTap={() => this.setState({ showAddForm: true })}
      />
    );
  }

  listItems(cannedResponses) {
    const SortableItem = SortableElement(({ value: response }) => {
      if (this.state.currentlyEditing.indexOf(response.id) != -1) {
        // we're editing this response
        return (
          <div className={css(styles.formContainer)} key={response.id}>
            <div className={css(styles.form)}>
              <CampaignCannedResponseForm
                submitLabel="Update Response"
                onSaveCannedResponse={newData =>
                  this.handleEdit(response.id, newData)
                }
                customFields={this.props.customFields}
                closeForm={() => {
                  this.stopEditing(response.id);
                }}
                initialTitle={response.title}
                initialText={response.text}
                initialSurveyQuestion={response.surveyQuestion}
              />
            </div>
          </div>
        );
      }

      // not editing; just display it
      const title = response.surveyQuestion
        ? `[${response.surveyQuestion}] ${response.title}`
        : response.title;

      return (
        <ListItem
          {...dataTest("cannedResponse")}
          value={response.text}
          key={response.id}
          primaryText={title}
          secondaryText={response.text}
          rightIconButton={
            <IconButton
              onTouchTap={() => {
                this.handleDelete(response);
              }}
            >
              <DeleteIcon />
            </IconButton>
          }
          onClick={() => {
            this.startEditing(response.id);
          }}
          secondaryTextLines={2}
        />
      );
    });

    const SortableList = SortableContainer(({ items }) => {
      return (
        <ul>
          {items.map((value, index) => (
            <SortableItem
              key={`item-${value.id}`}
              index={index}
              value={value}
            />
          ))}
        </ul>
      );
    });

    return (
      <SortableList
        items={cannedResponses.filter(response => !response.deleted)}
        onSortEnd={this.handleSort}
        distance={5}
      />
    );
  }

  onDelete = () => {
    this.setState({
      responseUploadError: null,
      uploadError: null,
      parsedData: null,
      validationStats: null,
      fields: null,
      state: "idle"
    });
  };

  handleUploadError(error, validationStats, fields) {
    this.setState({
      validationStats,
      responseUploadError: error,
      responses: [],
      fields,
      state: "parsed"
    });
  }

  handleUploadSuccess(validationStats, responses, fields) {
    this.setState({
      validationStats,
      responseUploadError: null,
      responses,
      fields,
      state: "parsed"
    });

    const newResponses = responses.map(response => {
      const { Body, Title } = response;
      const surveyQuestion = response["Data Item"];
      const id = Math.random()
        .toString(36)
        .replace(/[^a-zA-Z1-9]+/g, "");
      return {
        id,
        title: Title,
        text: Body,
        surveyQuestion,
        isNew: true
      };
    });
    this.props.onChange({
      cannedResponses: [
        ...this.props.formValues.cannedResponses,
        ...newResponses
      ]
    });
  }

  handleUpload = (acceptedFiles, rejectedFiles) => {
    if (
      rejectedFiles.length > 0 ||
      acceptedFiles.length + rejectedFiles.length > 1
    ) {
      this.setState({ error: "Please upload a single CSV file" });
      return;
    }

    const { customFields } = this.props;
    const file = acceptedFiles[0];
    this.setState({ state: "parsing" }, () => {
      parseResponsesCSV(
        file,
        customFields,
        ({ responses, fields, validationStats, error }) => {
          const { invalidFieldCount, missingFieldCount } = validationStats;

          const hasNoResponses =
            !!invalidFieldCount.length &&
            !!missingFieldCount.length &&
            !!responses.length;

          if (error) {
            this.setState({ responseUploadError, state: "idle" });
          } else if (hasNoResponses) {
            this.handleUploadError("Upload at least one response");
          } else if (responses && responses.length === 0) {
            this.handleUploadError(
              "Errors found in responses, none were uploaded.",
              validationStats,
              fields
            );
          } else {
            this.handleUploadSuccess(validationStats, responses, fields);
          }
        }
      );
    });
  };

  render() {
    const { formValues } = this.props;
    const cannedResponses = formValues.cannedResponses;
    const { responseUploadError } = this.state;
    const list =
      cannedResponses.length === 0 ? null : (
        <List>
          {this.listItems(cannedResponses)}
          <Divider />
        </List>
      );

    return (
      <GSForm
        schema={this.formSchema}
        value={formValues}
        onChange={this.props.onChange}
      >
        <CampaignFormSectionHeading
          title="Script responses for texters"
          subtitle="Save some scripts for your texters to use to answer additional FAQs that may come up outside of the survey questions and scripts you already set up. Add responses by uploading a CSV of script responses or add them manually."
        />
        {this.showUploadButton()}
        {list}
        <h3>Add Manually</h3>
        {this.showAddForm()}
        <Form.Button
          type="submit"
          disabled={this.props.saveDisabled}
          label={this.props.saveLabel}
          onClick={e => {
            e.stopPropagation();
            return !this.props.saveDisabled && this.props.onSubmit();
          }}
        />
      </GSForm>
    );
  }
}

CampaignCannedResponsesForm.propTypes = {
  saveLabel: type.string,
  saveDisabled: type.bool,
  onSubmit: type.func,
  onChange: type.func,
  formValues: type.object,
  customFields: type.array
};
