import type from "prop-types";
import React from "react";
import CampaignCannedResponseForm from "./CampaignCannedResponseForm";
import FlatButton from "material-ui/FlatButton";
import Form from "react-formal";
import GSForm from "./forms/GSForm";
import { List, ListItem } from "material-ui/List";
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
  }
});

export default class CampaignCannedResponsesForm extends React.Component {
  constructor(props) {
    super(props);
  }

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

  render() {
    const { formValues } = this.props;
    const cannedResponses = formValues.cannedResponses;
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
          title="Canned responses for texters"
          subtitle="Save some scripts for your texters to use to answer additional FAQs that may come up outside of the survey questions and scripts you already set up."
        />
        {list}
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
