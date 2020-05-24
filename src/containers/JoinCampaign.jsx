import PropTypes from "prop-types";
import React from "react";
import loadData from "./hoc/load-data";
import gql from "graphql-tag";
import wrapMutations from "./hoc/wrap-mutations";
import { withRouter } from "react-router";
import { StyleSheet, css } from "aphrodite";
import RaisedButton from "material-ui/RaisedButton";

const styles = StyleSheet.create({
  errorMessageWrapper: {
    position: "relative",
    top: "20vh",
    margin: "20px",
    textAlign: "center"
  },
  errorImage: {
    width: "150px",
    height: "150px"
  },
  errorImageLarge: {
    width: "300px",
    height: "200px"
  }
});

const errors = {
  CAMPAIGN_ARCHIVED: {
    title: "Oops!",
    message:
      "This campaign is no longer active. Check the Slack for a different invite link."
  },
  CAMPAIGN_FULL: {
    title:
      "It looks like enough volunteers are already working on this campaign.",
    message:
      "Please check the slack or email Madeline Parra to see if there is a different campaign link for you."
  },
  NOT_FOUND: {
    title: "Oops!",
    message: "That's not a valid invite link."
  },
  UNKNOWN: {
    title: "Oops!",
    message:
      "Something went wrong trying to join this campaign. Please try again in a moment or post in Slack for help."
  }
};

class JoinCampaign extends React.Component {
  state = {
    errorMessage: null
  };

  async UNSAFE_componentWillMount() {
    let errorCode;
    let organizationId;
    let assignmentId;

    if (this.props.params.token) {
      try {
        const addResult = await this.props.mutations.assignUserToCampaign();
        if (addResult.errors) {
          errorCode = addResult.errors.graphQLErrors[0].code;

          if (errorCode === "UNAUTHORIZED") {
            window.location = `/login?nextUrl=${window.location.pathname}`;
            return;
          }
        } else {
          ({
            id: assignmentId,
            campaign: {
              organization: { id: organizationId }
            }
          } = addResult.data.assignUserToCampaign);
        }
      } catch (ex) {
        errorCode = "UNKNOWN";
      }
    }
    if (errorCode) {
      this.setState({
        errorCode
      });
      return;
    }

    if (assignmentId && organizationId) {
      this.props.router.push(
        `/app/${organizationId}/todos/${assignmentId}/overview`
      );
    }
  }

  render() {
    if (!this.state.errorCode) {
      return <div />;
    }

    const errorConfig = errors[this.state.errorCode] || errors.UNKNOWN;
    return this.state.errorCode ? (
      <div>
        <div className={css(styles.errorMessageWrapper)}>
          <h2 className={css(styles.errorHeader)}>{errorConfig.title}</h2>
          <p>{errorConfig.message}</p>
          <RaisedButton
            primary
            label="Go Back Home"
            type="button"
            onClick={() => {
              this.props.router.push(`/`);
            }}
          />
        </div>
      </div>
    ) : (
      <div />
    );
  }
}

JoinCampaign.propTypes = {
  mutations: PropTypes.object,
  router: PropTypes.object,
  params: PropTypes.object
};

const mapMutationsToProps = ({ ownProps }) => ({
  assignUserToCampaign: () => ({
    mutation: gql`
      mutation assignUserToCampaign($token: String!) {
        assignUserToCampaign(token: $token) {
          id
          campaign {
            organization {
              id
            }
          }
        }
      }
    `,
    variables: {
      token: ownProps.params.token
    }
  })
});

export default loadData(wrapMutations(withRouter(JoinCampaign)), {
  mapMutationsToProps
});
