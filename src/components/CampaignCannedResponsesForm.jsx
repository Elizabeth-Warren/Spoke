import type from "prop-types";
import React from "react";
import _ from "lodash";
import Form from "react-formal";
import yup from "yup";
import { StyleSheet, css } from "aphrodite";
import { SortableContainer, SortableElement } from "react-sortable-hoc";
import arrayMove from "array-move";

import { List, ListItem } from "material-ui/List";
import Divider from "material-ui/Divider";
import DeleteIcon from "material-ui/svg-icons/action/delete";
import IconButton from "material-ui/IconButton";
import CreateIcon from "material-ui/svg-icons/content/create";
import WarningIcon from "material-ui/svg-icons/alert/warning";
import FlatButton from "material-ui/FlatButton";

import { validateScript } from "src/lib/scripts";
import { dataTest } from "src/lib/attributes";
import theme from "src/styles/theme";
import CSVUploader from "src/containers/CSVUploader";

import CampaignCannedResponseForm from "./CampaignCannedResponseForm";
import LabelChips from "./LabelChips";
import CampaignFormSectionHeading from "./CampaignFormSectionHeading";
import GSForm from "./forms/GSForm";

const warningIcon = <WarningIcon color={theme.colors.EWred} />;

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
  customFieldsError: {
    backgroundColor: theme.colors.red,
    padding: "10px 5px"
  },
  listSubheader: {
    fontSize: 14,
    color: theme.colors.gray
  }
});

export default class CampaignCannedResponsesForm extends React.Component {
  state = {
    showAddForm: false,
    currentlyEditing: []
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
          }

          // This response has been saved to the backend --
          // soft-delete it
          return {
            ...responseToDelete,
            deleted: true
          };
        }

        return responseToDelete;
      })
      .filter(ele => ele !== null);

    this.props.onChange({
      cannedResponses: newVals
    });
  };

  stopEditing = responseId => {
    this.setState(state => ({
      currentlyEditing: state.currentlyEditing.filter(id => id !== responseId)
    }));
  };

  startEditing = responseId => {
    this.setState(state => ({
      currentlyEditing: state.currentlyEditing.concat([responseId])
    }));
  };

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
    const labelsBySlug = _.keyBy(this.props.labels, "slug");

    const fields = [
      {
        inputName: "Body",
        aliases: ["body"],
        apiName: "body",
        required: true,
        description: "Text of the response to send to the contact",
        validate(value) {
          return value && value.length > 0 && value.length <= 1500;
        }
      },
      {
        inputName: "Title",
        aliases: ["title"],
        apiName: "title",
        required: true,
        description: "Title of the response to show to the texter",
        validate(value) {
          return value && value.length > 0 && value.length <= 1500;
        }
      },
      {
        inputName: "Data Item",
        aliases: ["data item", "dataItem", "data_item"],
        apiName: "labelIds",
        description: "Space-separated list of label slugs",
        transformAndValidate(val) {
          return Array.from(
            new Set(
              val
                .split(/\s+/)
                .map(slug => slug.trim().toLowerCase())
                .filter(slug => slug.length > 0)
                .map(slug => {
                  if (!labelsBySlug[slug]) {
                    throw new Error(`No label matches the data item "${slug}"`);
                  }

                  return labelsBySlug[slug].id;
                })
            )
          );
        }
      }
    ];

    return (
      <div>
        {this.state.customFieldsError && (
          <div className={css(styles.customFieldsError)}>
            {this.state.customFieldsError}
          </div>
        )}
        <CSVUploader
          onUpload={this.handleUploadSuccess}
          maxRows={500}
          columnConfig={fields}
        />
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
              labels={this.props.labels}
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
        onClick={() => this.setState({ showAddForm: true })}
      />
    );
  }

  listItems(cannedResponses) {
    const { customFields } = this.props;
    const SortableItem = SortableElement(({ value: response }) => {
      if (this.state.currentlyEditing.indexOf(response.id) !== -1) {
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
                initialLabelIds={response.labelIds}
                labels={this.props.labels}
              />
            </div>
          </div>
        );
      }

      // not editing; just display it
      const { missingFields = [] } = validateScript({
        script: response.text,
        customFields
      });

      return (
        <ListItem
          {...dataTest("cannedResponse")}
          value={response.text}
          key={response.id}
          leftIcon={missingFields.length ? warningIcon : null}
          rightIconButton={
            <IconButton
              onClick={() => {
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
        >
          <p>{response.title}</p>
          <p className={css(styles.listSubheader)}>{response.text}</p>
          <LabelChips labels={this.props.labels} labelIds={response.labelIds} />
        </ListItem>
      );
    });

    const SortableList = SortableContainer(({ items }) => (
      <ul>
        {items.map((value, index) => (
          <SortableItem key={`item-${value.id}`} index={index} value={value} />
        ))}
      </ul>
    ));

    return (
      <SortableList
        items={cannedResponses.filter(response => !response.deleted)}
        onSortEnd={this.handleSort}
        distance={5}
      />
    );
  }

  updateMissingFields() {
    const invalidCustomFields = this.props.getMissingCustomFields();
    const fieldString = invalidCustomFields.join(", ");
    const customFieldsError = invalidCustomFields.length
      ? `The following custom fields were not included in your contacts upload: ${fieldString}`
      : null;
    this.setState({ customFieldsError });
  }

  UNSAFE_componentWillReceiveProps() {
    this.updateMissingFields();
  }

  componentDidMount() {
    const { cannedResponses } = this.props.formValues;
    if (cannedResponses.length) {
      this.updateMissingFields(cannedResponses);
    }
  }

  showRepliesList() {
    const { cannedResponses } = this.props.formValues;
    return cannedResponses.length === 0 ? null : (
      <List>
        {this.listItems(cannedResponses)}
        <Divider />
      </List>
    );
  }

  handleUploadSuccess = ({ data }) => {
    const newResponses = data.map(response => {
      const id = Math.random()
        .toString(36)
        .replace(/[^a-zA-Z1-9]+/g, "");

      return {
        id,
        title: response.title,
        text: response.body,
        labelIds: response.labelIds,
        isNew: true
      };
    });

    this.props.onChange({
      cannedResponses: [
        ...this.props.formValues.cannedResponses,
        ...newResponses
      ]
    });
  };

  render() {
    const { formValues } = this.props;

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
        {this.showRepliesList()}
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
  customFields: type.array,
  labels: type.array,
  getMissingCustomFields: type.func
};
