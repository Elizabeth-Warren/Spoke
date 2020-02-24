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
  errorHeader: {
    fontFamily: "Ringside Compressed A",
    textTransform: "uppercase"
  }
});

class JoinCampaign extends React.Component {
  state = {
    errorMessage: null
  };

  async UNSAFE_componentWillMount() {
    let errorMessage;
    let organizationId;
    let assignmentId;

    if (this.props.params.token) {
      try {
        const addResult = await this.props.mutations.assignUserToCampaign();
        if (addResult.errors) {
          errorMessage = addResult.errors.graphQLErrors[0].message;
        } else {
          ({
            id: assignmentId,
            campaign: {
              organization: { id: organizationId }
            }
          } = addResult.data.assignUserToCampaign);
        }
      } catch (ex) {
        errorMessage =
          "Something went wrong trying to join this campaign. Please post in Slack for help.";
      }
    }
    if (errorMessage) {
      this.setState({
        errorMessage
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
    return this.state.errorMessage ? (
      <div>
        <div className={css(styles.errorMessageWrapper)}>
          <img
            src="https://ew-spoke-public.elizabethwarren.codes/ew-circle.png"
            className={css(styles.errorImage)}
            alt="EW Making Calls"
          />
          <h2 className={css(styles.errorHeader)}>Oops!</h2>
          <p>{this.state.errorMessage}</p>
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
