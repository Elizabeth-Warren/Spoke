import PropTypes from "prop-types";
import React from "react";
import loadData from "./hoc/load-data";
import gql from "graphql-tag";
import Form from "react-formal";
import yup from "yup";
import { StyleSheet, css } from "aphrodite";
import wrapMutations from "./hoc/wrap-mutations";
import theme from "../styles/theme";
import Paper from "material-ui/Paper";
import { withRouter } from "react-router";
import GSForm from "../components/forms/GSForm";
import { dataTest } from "../lib/attributes";

const styles = StyleSheet.create({
  container: {
    marginTop: "5vh",
    textAlign: "center",
    color: theme.colors.white
  },
  formContainer: {
    ...theme.layouts.greenBox
  },
  bigHeader: {
    ...theme.text.header,
    fontSize: 40
  },
  header: {
    ...theme.text.header,
    marginRight: "auto",
    marginLeft: "auto",
    maxWidth: "80%"
  },
  form: {
    marginTop: 40,
    maxWidth: "80%",
    marginRight: "auto",
    marginLeft: "auto"
  }
});

class CreateOrganization extends React.Component {
  formSchema = yup.object({
    name: yup.string().required()
  });

  renderForm() {
    return (
      <div>
        <div className={css(styles.header)}>
          Create your organization to get started.
        </div>
        <div className={css(styles.form)}>
          <Paper style={{ padding: 20 }}>
            <GSForm
              schema={this.formSchema}
              onSubmit={async formValues => {
                const newOrganization = await this.props.mutations.createOrganization(
                  formValues.name
                );
                if (newOrganization.errors) {
                  throw new Error(newOrganization.errors.message);
                }
                this.props.router.push(
                  `/admin/${newOrganization.data.createOrganization.id}`
                );
              }}
            >
              <Form.Field
                {...dataTest("organization")}
                name="name"
                label="Your organization"
                hintText="Bartlet Campaign"
                fullWidth
              />
              <Form.Button
                type="submit"
                label="Get Started"
                name="submit"
                value="Get Started"
                fullWidth
                secondary
                style={{ marginTop: 40 }}
              />
            </GSForm>
          </Paper>
        </div>
      </div>
    );
  }

  render() {
    return (
      <div className={css(styles.container)}>
        <div className={css(styles.bigHeader)}>Spoke</div>
        <div className={css(styles.formContainer)}>{this.renderForm()}</div>
      </div>
    );
  }
}

const mapQueriesToProps = ({ ownProps }) => ({
  userData: {
    query: gql`
      query getCurrentUser {
        currentUser {
          id
        }
      }
    `,
    forceFetch: true
  }
});

CreateOrganization.propTypes = {
  mutations: PropTypes.object,
  router: PropTypes.object,
  userData: PropTypes.object,
  inviteData: PropTypes.object
};

const mapMutationsToProps = () => ({
  createOrganization: name => ({
    mutation: gql`
      mutation createOrganization($name: String!) {
        createOrganization(name: $name) {
          id
        }
      }
    `,
    variables: { name }
  })
});

export default loadData(wrapMutations(withRouter(CreateOrganization)), {
  mapQueriesToProps,
  mapMutationsToProps
});
