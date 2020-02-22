import React, { Component } from "react";
import types from "prop-types";
import RaisedButton from "material-ui/RaisedButton";
import Badge from "material-ui/Badge";
import { withRouter } from "react-router";
import gql from "graphql-tag";

import loadData from "src/containers/hoc/load-data";
import wrapMutations from "src/containers/hoc/wrap-mutations";
import ApolloClientSingleton from "src/network/apollo-client-singleton";

const inlineStyles = {
  badge: {
    fontSize: 12,
    top: 20,
    right: 20,
    padding: "4px 2px 0px 2px",
    width: 20,
    textAlign: "center",
    verticalAlign: "middle",
    height: 20
  }
};

class RequestBatchButton extends Component {
  static propTypes = {
    organizationId: types.string.isRequired,
    assignmentId: types.string.isRequired,
    buttonLabel: types.string.isRequired,
    unsentCount: types.number,
    mutations: types.shape({
      findNewCampaignContact: types.func
    }),
    router: types.object,
    secondary: types.bool,
    disabled: types.bool
  };

  constructor(props) {
    super(props);

    this.state = {
      errorMessage: null,
      loading: false
    };
  }

  handleClick = async () => {
    if (this.state.loading || this.props.disabled) {
      return;
    }
    this.setState({
      errorMessage: null,
      loading: true
    });

    const {
      organizationId,
      assignmentId,
      mutations,
      router,
      unsentCount
    } = this.props;

    if (!unsentCount) {
      const result = await mutations.findNewCampaignContact(assignmentId);

      if (result.errors) {
        this.setState({
          loading: false,
          errorMessage:
            "Error while getting you a batch. Please try again or post in the Slack."
        });
        return;
      }

      if (!result.data.findNewCampaignContact.found) {
        // No contacts left
        this.setState({
          loading: false,
          errorMessage:
            "No unassigned contacts left in this campaign -- we're all done!"
        });
        return;
      }
    }

    // XXX HACK[bsw]: normally we'd just make the initial send texter use networkPolicy: "network-only"
    // to force it to re-load the assignments before showing them. But doing that causes it to re-fetch
    // the assignments every time you request a new message, so we do this hack to clear the store and
    // force a refetch just the first time.
    await ApolloClientSingleton.resetStore();

    router.push(`/app/${organizationId}/todos/${assignmentId}/text`);
  };

  renderButton() {
    return (
      <RaisedButton
        onTouchTap={this.handleClick}
        label={this.props.buttonLabel}
        disabled={this.loading || this.props.disabled}
        primary={!this.props.secondary}
        secondary={this.props.secondary}
        title="Send Another Batch"
      />
    );
  }

  render() {
    return (
      <span>
        {this.props.unsentCount ? (
          <Badge
            badgeStyle={inlineStyles.badge}
            badgeContent={this.props.unsentCount}
            secondary={!this.props.secondary}
          >
            {this.renderButton()}
          </Badge>
        ) : (
          this.renderButton()
        )}

        <span style={{ marginLeft: "10px" }}>{this.state.errorMessage}</span>
      </span>
    );
  }
}

const mapMutationsToProps = () => ({
  findNewCampaignContact: assignmentId => ({
    mutation: gql`
      mutation findNewCampaignContact(
        $assignmentId: String!
        $numberContacts: Int
      ) {
        findNewCampaignContact(
          assignmentId: $assignmentId
          numberContacts: $numberContacts
        ) {
          found
        }
      }
    `,
    variables: {
      assignmentId,
      numberContacts: null
    }
  })
});

export default loadData(wrapMutations(withRouter(RequestBatchButton)), {
  mapMutationsToProps
});
