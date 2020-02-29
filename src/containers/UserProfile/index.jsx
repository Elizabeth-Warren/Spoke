import React, { useState } from "react";
import types from "prop-types";
import Form from "react-formal";
import yup from "yup";
import _ from "lodash";
import gql from "graphql-tag";

import Toggle from "material-ui/Toggle";

import GSForm from "src/components/forms/GSForm";
import loadData from "src/containers/hoc/load-data";
import wrapMutations from "src/containers/hoc/wrap-mutations";
import { getGraphQLErrors } from "src/client/lib/error-helpers";

const formSchema = yup.object({
  firstName: yup.string().required(),
  lastName: yup.string().required(),
  subscribedToReminders: yup.boolean().required()
});

function UserProfile({ data, mutations }) {
  const [formData, setFormData] = useState(
    _.pick(data.currentUser, "firstName", "lastName", "subscribedToReminders")
  );

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null);

  async function handleSave(newData) {
    if (isSaving) {
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const result = await mutations.editSelf(newData);
      if (getGraphQLErrors(result).length > 0) {
        throw new Error("GraphQL update failed");
      }

      setMessage("Profile updated!");
    } catch (e) {
      setMessage("Error: unable to updated profile.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div>
      <h2>Account Details</h2>
      <GSForm
        schema={formSchema}
        onSubmit={handleSave}
        value={formData}
        onChange={setFormData}
      >
        <div style={{ marginBottom: "20px" }}>
          <Form.Field label="First name" name="firstName" />
          <Form.Field label="Last name" name="lastName" />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <p>
            Email: <strong>{data.currentUser.email}</strong>
            <br />
            Ask a Text Team Leader in Slack if you need to change your email.
          </p>
          <Form.Field
            name="subscribedToReminders"
            type={Toggle}
            toggled={formData.subscribedToReminders}
            onToggle={(__, isToggled) => {
              setFormData({ ...formData, subscribedToReminders: isToggled });
            }}
            label="Receive email reminders when I have replies waiting for me"
            labelPosition="right"
          />
        </div>

        <div>
          <Form.Button
            type="submit"
            label={isSaving ? "Saving..." : "Save"}
            disabled={isSaving}
            style={{ marginBottom: "5px" }}
          />
          {message}
        </div>
      </GSForm>
    </div>
  );
}

const mapQueriesToProps = () => ({
  data: {
    query: gql`
      query getCurrentUser {
        currentUser {
          id
          firstName
          lastName
          subscribedToReminders
          email
        }
      }
    `
  }
});

const mapMutationsToProps = () => ({
  editSelf: ({ firstName, lastName, subscribedToReminders }) => ({
    mutation: gql`
      mutation editSelf(
        $firstName: String!
        $lastName: String!
        $subscribedToReminders: Boolean!
      ) {
        editSelf(
          userData: {
            firstName: $firstName
            lastName: $lastName
            subscribedToReminders: $subscribedToReminders
          }
        ) {
          id
          firstName
          lastName
          subscribedToReminders
        }
      }
    `,
    variables: {
      firstName,
      lastName,
      subscribedToReminders
    }
  })
});

UserProfile.propTypes = {
  data: types.object,
  mutations: types.shape({
    editSelf: types.func
  })
};

export default loadData(wrapMutations(UserProfile), {
  mapQueriesToProps,
  mapMutationsToProps
});
