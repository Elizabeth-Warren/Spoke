import type from "prop-types";
import React from "react";
import _ from "lodash";
import Form from "react-formal";
import yup from "yup";
import { StyleSheet, css } from "aphrodite";
import { SortableContainer, SortableElement } from "react-sortable-hoc";
import arrayMove from "array-move";
import AutoSizer from "react-virtualized-auto-sizer";
import { Dialog } from "material-ui";
import { List } from "react-virtualized";

import DeleteIcon from "material-ui/svg-icons/action/delete";
import IconButton from "material-ui/IconButton";
import CreateIcon from "material-ui/svg-icons/content/create";
import WarningIcon from "material-ui/svg-icons/alert/warning";
import FlatButton from "material-ui/FlatButton";

import { validateScript } from "src/lib/scripts";
import { dataTest } from "src/lib/attributes";
import theme from "src/styles/theme";
import CSVUploader from "src/containers/CSVUploader";
import CannedResponseListItem from "src/components/CannedResponseListItem";

import CampaignCannedResponseForm from "./CampaignCannedResponseForm";
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
  },
  listItemWrapper: {
    backgroundColor: "white"
  },
  list: {
    border: `1px solid ${theme.colors.lightGray}`
  }
});

const SortableItem = SortableElement(
  ({
    value: response,
    style,
    customFields,
    labels,
    onClickDelete,
    onClickItem
  }) => {
    // not editing; just display it
    const { missingFields = [] } = validateScript({
      script: response.text,
      customFields
    });

    return (
      <div style={style} className={css(styles.listItemWrapper)}>
        <CannedResponseListItem
          response={response}
          labels={labels}
          labelIds={response.labelIds || []}
          leftIcon={missingFields.length ? warningIcon : null}
          rightIconButton={
            <IconButton onClick={onClickDelete}>
              <DeleteIcon />
            </IconButton>
          }
          onClick={onClickItem}
        />
      </div>
    );
  }
);

const SortableList = SortableContainer(List, { withRef: true });

class SortableVirtualizedList extends React.Component {
  propTypes = {
    customFields: type.array,
    items: type.array,
    labels: type.array,
    onClickItem: type.func,
    handleDelete: type.func,
    getRef: type.func,
    onSortEnd: type.func,
    distance: type.number
  };

  renderRow = ({ index, key, style }) => {
    const { customFields, items, labels, onClickItem } = this.props;

    return (
      <SortableItem
        value={items[index]}
        index={index}
        style={style}
        key={key}
        customFields={customFields}
        onClickDelete={() => this.props.handleDelete(items[index])}
        onClickItem={() => onClickItem(items[index])}
        labels={labels}
      />
    );
  };

  render() {
    const { items, getRef, onSortEnd, distance } = this.props;

    return (
      <AutoSizer disableHeight>
        {({ width }) => (
          <SortableList
            ref={getRef}
            rowHeight={250}
            rowRenderer={this.renderRow}
            rowCount={items.length}
            width={width - 2}
            height={window.innerHeight - 100}
            onSortEnd={onSortEnd}
            distance={distance}
          />
        )}
      </AutoSizer>
    );
  }
}

export default class CampaignCannedResponsesForm extends React.Component {
  state = {
    showAddForm: false,
    currentlyEditing: null
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
            deleted: true,
            isUpdated: true
          };
        }

        return responseToDelete;
      })
      .filter(ele => ele !== null);

    this.props.onChange({
      cannedResponses: newVals
    });
  };

  stopEditing = () => {
    this.setState({
      currentlyEditing: null
    });
  };

  startEditing = response => {
    this.setState({
      currentlyEditing: response.id
    });
  };

  handleEdit = (responseId, newData) => {
    const newVals = this.props.formValues.cannedResponses.map(
      responseToEdit => {
        if (responseToEdit.id === responseId) {
          return {
            ...responseToEdit,
            ...newData,
            isUpdated: true
          };
        }

        return responseToEdit;
      }
    );

    this.props.onChange({
      cannedResponses: newVals
    });

    this.updateVirtualList();

    this.stopEditing();
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

    this.updateVirtualList();
  };

  updateVirtualList = () => {
    if (this.listInstance) {
      this.listInstance.recomputeRowHeights();
      this.listInstance.forceUpdate();
    }
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

  registerListRef = listInstance => {
    if (listInstance) {
      this.listInstance = listInstance.getWrappedInstance();
    }
  };

  listItems() {
    const { cannedResponses } = this.props.formValues;
    const items = cannedResponses.filter(response => !response.deleted);

    return (
      <div className={css(styles.list)}>
        <SortableVirtualizedList
          items={items}
          getRef={this.registerListRef}
          onSortEnd={this.handleSort}
          distance={5}
          customFields={this.props.customFields}
          labels={this.props.labels}
          handleDelete={this.handleDelete}
          onClickItem={this.startEditing}
        />
      </div>
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
    return cannedResponses.length === 0 ? null : this.listItems();
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

  handleSubmit = async () => {
    this.setState({ submitting: true });
    await this.props.onSubmit();
    this.setState({ submitting: false });
  };

  renderEditDialog() {
    const { cannedResponses } = this.props.formValues;

    const response = cannedResponses.find(
      ({ id }) => id === this.state.currentlyEditing
    );

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
          disabled={this.props.saveDisabled || this.state.submitting}
          label={this.state.submitting ? "Submitting..." : this.props.saveLabel}
          onClick={e => {
            e.stopPropagation();
            return (
              !this.props.saveDisabled &&
              !this.state.submitting &&
              this.handleSubmit()
            );
          }}
        />

        <Dialog
          title="Edit Response"
          open={this.state.currentlyEditing != null}
          onRequestClose={this.stopEditing}
        >
          {this.state.currentlyEditing && this.renderEditDialog()}
        </Dialog>
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
