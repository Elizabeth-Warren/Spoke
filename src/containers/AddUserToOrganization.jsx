import React, { Component } from "react";
import type from "prop-types";
import { TextField } from "material-ui";
import { RaisedButton } from "material-ui";
import RolesDropdown from "src/components/PeopleList/RolesDropdown";
import { StyleSheet, css } from "aphrodite";
import loadData from "./hoc/load-data";
import { withRouter } from "react-router";
import wrapMutations from "./hoc/wrap-mutations";
import gql from "graphql-tag";

const styles = StyleSheet.create({
  formRow: {
    display: "flex",
    flexDirection: "row"
  },
  emailWrapper: {
    flex: 1,
    paddingTop: "8px"
  },
  buttonWrapper: {
    paddingTop: "12px"
  }
});

class AddUserToOrganization extends Component {
  constructor(props) {
    super(props);

    this.state = {
      email: "",
      role: "ADMIN",
      message: ""
    };
  }

  handleRoleChange = (userId, newRole) => {
    this.setState({ role: newRole });
  };

  handleEmailChange = evt => {
    this.setState({ email: evt.target.value });
  };

  handleAdd = async evt => {
    this.setState({
      message: ""
    });

    const addResponse = await this.props.mutations.addUserToOrganizationByEmail(
      this.props.organizationId,
      this.state.email,
      this.state.role
    );

    if (addResponse.errors) {
      console.error(addResponse.errors);
      this.setState({ message: "Error while adding user." });
    }

    const addResult = addResponse.data.addUserToOrganizationByEmail;
    if (addResult === "USER_ADDED") {
      this.setState({
        message: `Added ${this.state.email} to organization.`,
        email: ""
      });
    } else if (addResult === "USER_ALREADY_IN_ORG") {
      this.setState({
        message: "That user is already in this organization.",
        email: ""
      });
    } else if (addResult === "NO_USER_WITH_EMAIL") {
      this.setState({
        message: "No user with that email."
      });
    }
  };

  render() {
    return (
      <div>
        <div className={css(styles.formRow)}>
          <div className={css(styles.emailWrapper)}>
            <TextField
              name="email"
              autoFocus
              value={this.state.email}
              onChange={this.handleEmailChange}
              placeholder="Email"
              fullWidth
            />
          </div>
          <div>
            <RolesDropdown
              roles={[this.state.role]}
              currentUser={this.props.currentUser}
              onChange={this.handleRoleChange}
            />
          </div>
          <div className={css(styles.buttonWrapper)}>
            <RaisedButton label="Add" primary onClick={this.handleAdd} />
          </div>
        </div>
        <p>{this.state.message}</p>
      </div>
    );
  }

  static propTypes = {
    currentUser: type.object,
    organizationId: type.string
  };
}

const mapMutationsToProps = () => ({
  addUserToOrganizationByEmail: (organizationId, email, role) => ({
    mutation: gql`
      mutation addUserToOrganizationByEmail(
        $organizationId: String!
        $email: String!
        $role: String!
      ) {
        addUserToOrganizationByEmail(
          organizationId: $organizationId
          email: $email
          role: $role
        )
      }
    `,
    variables: { organizationId, email, role },
    refetchQueries: ["getUsers"]
  })
});

export default loadData(withRouter(wrapMutations(AddUserToOrganization)), {
  mapMutationsToProps
});
