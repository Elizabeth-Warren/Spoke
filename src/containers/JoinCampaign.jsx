import PropTypes from "prop-types";
import React from "react";
import loadData from "./hoc/load-data";
import gql from "graphql-tag";
import wrapMutations from "./hoc/wrap-mutations";
import { withRouter } from "react-router";
import { StyleSheet, css } from "aphrodite";
import theme from "../styles/theme";

const styles = StyleSheet.create({
  greenBox: {
    ...theme.layouts.greenBox
  }
});

class JoinCampaign extends React.Component {
  state = {
    errors: null
  };

  async componentWillMount() {
    let campaign;
    let hasError;
    if (this.props.params.token) {
      try {
        const addResult = await this.props.mutations.assignUserToCampaign();
        if (addResult.errors) {
          hasError = true;
        } else {
          campaign = addResult.data.assignUserToCampaign;
        }
      } catch (ex) {
        hasError = true;
      }
    }
    if (hasError) {
      this.setState({
        errors:
          "Something went wrong trying to join this campaign. Please post in Slack for help."
      });
      return;
    }
    if (campaign) {
      this.props.router.push(`/app/${campaign.organization.id}`);
    }
  }

  renderErrors() {
    if (this.state.errors) {
      return <div className={css(styles.greenBox)}>{this.state.errors}</div>;
    }
    return <div />;
  }

  render() {
    return <div>{this.renderErrors()}</div>;
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
          organization {
            id
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
