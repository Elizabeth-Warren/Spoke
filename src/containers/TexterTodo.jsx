import PropTypes from "prop-types";
import React from "react";
import AssignmentTexter from "src/containers/AssignmentTexter";

import { withRouter } from "react-router";
import loadData from "./hoc/load-data";
import gql from "graphql-tag";

export class TexterTodo extends React.Component {
  constructor(props) {
    super(props);
    this.refreshData = this.refreshData.bind(this);
  }

  componentWillMount() {
    const { assignment } = this.props.data;
    if (!assignment || assignment.campaign.isArchived) {
      this.props.router.push(`/app/${this.props.params.organizationId}/todos`);
    }
  }

  shouldComponentUpdate = nextProps => {
    if (nextProps.data.errors && this.props.params.organizationId) {
      // TODO: fix suspend redirect
      this.props.router.push(
        `/app/${this.props.params.organizationId}/suspended`
      );
    }
    return true;
  };

  requestBatch = async () => {
    const { assignment } = this.props.data;
    if (assignment.campaign.useDynamicAssignment) {
      const result = await this.props.mutations.findNewCampaignContact(
        assignment.id
      );
      if (result.errors) {
        // TODO[matteo] handle batch assign error;
        console.log(result.errors);
        throw new Error(`requestBatch failed: result.errors`);
      }
      const didAddContacts = result.data.findNewCampaignContact.found;
      console.log("requestBatch ?added", didAddContacts);
      if (didAddContacts) {
        await this.props.data.refetch();
      }
      return didAddContacts;
    }
  };

  refreshData = () => {
    this.props.data.refetch();
  };

  render() {
    const { assignment } = this.props.data;

    if (
      !assignment ||
      (this.props.data.errors && this.props.params.organizationId)
    ) {
      this.props.router.push(
        `/app/${this.props.params.organizationId}/suspended`
      );
    }

    const contacts = assignment ? assignment.contacts : [];
    const allContactsCount = assignment ? assignment.allContactsCount : 0;
    return (
      <AssignmentTexter
        assignment={assignment}
        contactsPreview={contacts}
        allContactsCount={allContactsCount}
        refreshData={this.refreshData}
        requestBatch={this.requestBatch}
        organizationId={this.props.params.organizationId}
        initialSendMode={this.props.messageStatus === "needsMessage"}
      />
    );
  }
}

TexterTodo.propTypes = {
  messageStatus: PropTypes.string,
  params: PropTypes.object,
  data: PropTypes.object,
  mutations: PropTypes.object,
  router: PropTypes.object
};

const mapQueriesToProps = ({ ownProps }) => ({
  data: {
    query: gql`
      query getContacts(
        $assignmentId: String!
        $contactsFilter: ContactsFilter!
      ) {
        assignment(id: $assignmentId) {
          id
          userCannedResponses {
            id
            title
            text
            isUserCreated
          }
          campaignCannedResponses {
            id
            title
            text
            surveyQuestion
            deleted
            isUserCreated
          }
          texter {
            id
            firstName
            lastName
            displayName
          }
          campaign {
            id
            title
            isArchived
            useDynamicAssignment
            overrideOrganizationTextingHours
            timezone
            textingHoursStart
            textingHoursEnd
            textingHoursEnforced
            shiftingConfiguration
            organization {
              id
              textingHoursEnforced
              textingHoursStart
              textingHoursEnd
              threeClickEnabled
              optOutMessage
            }
            customFields
            interactionSteps {
              id
              script
              question {
                text
                answerOptions {
                  value
                  nextInteractionStep {
                    id
                    script
                  }
                }
              }
            }
          }
          contacts(contactsFilter: $contactsFilter) {
            id
            messageStatus
            firstName
            lastName
          }
          allContactsCount: contactsCount
        }
      }
    `,
    // TODO ^ could slim down the requested contact data for initial send
    variables: {
      contactsFilter: {
        messageStatus: ownProps.messageStatus,
        isOptedOut: false,
        validTimezone: true
      },
      assignmentId: ownProps.params.assignmentId
    },
    forceFetch: true,
    pollInterval: 20000
  }
});

const mapMutationsToProps = ({ ownProps }) => ({
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
      // Note: lower the batch size by passing this param:
      numberContacts: null
    }
  })
});

export default loadData(withRouter(TexterTodo), {
  mapQueriesToProps,
  mapMutationsToProps
});
