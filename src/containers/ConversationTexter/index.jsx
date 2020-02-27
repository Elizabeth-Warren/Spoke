import PropTypes from "prop-types";
import React from "react";
import { StyleSheet, css } from "aphrodite";
import _ from "lodash";
import gql from "graphql-tag";
import { withRouter } from "react-router";

import theme from "src/styles/theme";

import loadData from "../hoc/load-data";
import { ConversationsMenu } from "./components";
import ConversationTexterContact from "./ConversationTexterContact";
import EmptyState from "./components/EmptyState";
import CampaignTopBar from "../CampaignTopBar";

const styles = StyleSheet.create({
  container: {
    margin: 0,
    position: "absolute",
    top: 48,
    bottom: 0,
    left: 0,
    right: 0,
    display: "flex",
    flexDirection: "row"
  },

  contactsSection: {
    backgroundColor: theme.colors.EWnavy,
    color: "white",
    height: "100%",
    width: "250px",
    overflowY: "scroll"
  },

  texterSection: {
    width: "calc(100% - 250px)"
  }
});

export class ConversationTexterComponent extends React.Component {
  static propTypes = {
    params: PropTypes.object,
    data: PropTypes.object,
    conversationData: PropTypes.object,
    mutations: PropTypes.object,
    router: PropTypes.object
  };

  constructor(props) {
    super(props);

    this.state = {
      currentContactId: this.getFirstConversationId()
    };
  }

  UNSAFE_componentWillMount() {
    const { assignment } = this.props.data;
    if (!assignment || assignment.campaign.isArchived) {
      this.props.router.push(`/app/${this.props.params.organizationId}/todos`);
    }
  }

  UNSAFE_componentWillReceiveProps(newProps) {
    if (this.state.currentContactId == null) {
      // we were on the empty state, let's see if we have a conversation that
      // we can auto-select
      const newFirstConvoId = this.getFirstConversationId(newProps);
      if (newFirstConvoId) {
        this.setState({
          currentContactId: newFirstConvoId
        });
      }
    }
  }

  getUnsentInitialCount() {
    const { assignment } = this.props.data;

    if (assignment && assignment.contactCounts) {
      const unsentInitials = assignment.contactCounts.find(
        ({ messageStatus }) => messageStatus === "needsMessage"
      );

      if (unsentInitials != null) {
        return unsentInitials.count;
      }
    }

    return 0;
  }

  getSortedConversations() {
    const {
      contactsForAssignment: conversations
    } = this.props.conversationData;

    if (!conversations) {
      return [];
    }

    return _.sortBy(conversations, c => (c.updatedAt ? -c.updatedAt : 0));
  }

  getFirstConversationId(props = this.props) {
    const { contactsForAssignment: conversations } = props.conversationData;

    const firstActiveConversation = conversations.find(
      c => c.messageStatus !== "closed"
    );

    if (!firstActiveConversation) {
      return null;
    }

    return firstActiveConversation.id;
  }

  getNextConversationId() {
    const {
      contactsForAssignment: conversations
    } = this.props.conversationData;

    if (conversations.length <= 1) {
      // there are no conversations, or the current one is the
      // last one
      return null;
    }

    const currentConversationIndex = _.findIndex(conversations, {
      id: this.state.currentContactId
    });

    if (!currentConversationIndex < 0) {
      // Couldn't find current conversation -- this shouldn't happen
      return conversations[0].id;
    }

    // Find the next active conversation
    let nextConversationIndex =
      (currentConversationIndex + 1) % conversations.length;

    while (nextConversationIndex !== currentConversationIndex) {
      if (conversations[nextConversationIndex].messageStatus !== "closed") {
        return conversations[nextConversationIndex].id;
      }

      nextConversationIndex =
        (nextConversationIndex + 1) % conversations.length;
    }

    // No more active conversations
    return null;
  }

  handleAdvanceContact = () => {
    this.setState({ currentContactId: this.getNextConversationId() });
  };

  renderConversationList() {
    const { assignment } = this.props.data;

    return (
      <ConversationsMenu
        currentContactId={this.state.currentContactId}
        onSelectContact={contactId => {
          this.setState({ currentContactId: contactId });
        }}
        conversations={this.props.conversationData.contactsForAssignment}
        organizationId={this.props.params.organizationId}
        assignmentId={this.props.params.assignmentId}
        unsentInitialCount={this.getUnsentInitialCount()}
        moreBatchesAvailable={
          this.state.currentContactId != null &&
          assignment &&
          assignment.campaign.useDynamicAssignment &&
          assignment.campaign.hasUnassignedContactsForTexter
        }
      />
    );
  }

  renderTexterContact() {
    const {
      data: { assignment },
      router
    } = this.props;

    if (!assignment) {
      return null;
    }

    if (!this.state.currentContactId) {
      return (
        <EmptyState
          campaign={assignment.campaign}
          assignment={assignment}
          organizationId={assignment.campaign.organization.id}
          unsentInitialCount={this.getUnsentInitialCount()}
        />
      );
    }

    return (
      <ConversationTexterContact
        contactId={this.state.currentContactId}
        campaign={assignment.campaign}
        assignment={assignment}
        texter={assignment.texter}
        router={router}
        advanceContact={this.handleAdvanceContact}
      />
    );
  }

  render() {
    const {
      data: { assignment }
    } = this.props;

    return (
      <div>
        {assignment && (
          <CampaignTopBar
            campaign={assignment.campaign}
            organizationId={assignment.campaign.organization.id}
            assignmentId={assignment.id}
          />
        )}
        <div className={css(styles.container)}>
          <div className={css(styles.contactsSection)}>
            {this.renderConversationList()}
          </div>
          <div className={css(styles.texterSection)}>
            {this.renderTexterContact()}
          </div>
        </div>
      </div>
    );
  }
}
const mapQueriesToProps = ({ ownProps }) => ({
  data: {
    query: gql`
      query getAssignment($assignmentId: String!) {
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
            labels {
              id
              group
              displayValue
              slug
            }
          }
          texter {
            id
            firstName
            lastName
            displayName
          }
          contactCounts {
            messageStatus
            count
          }
          campaign {
            id
            title
            isArchived
            useDynamicAssignment
            hasUnassignedContactsForTexter
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
        }
      }
    `,
    variables: {
      assignmentId: ownProps.params.assignmentId
    },
    fetchPolicy: "network-only",
    pollInterval: 60000
  },
  conversationData: {
    query: gql`
      query getContacts(
        $assignmentId: String!
        $contactsFilter: ContactsFilter
      ) {
        contactsForAssignment(
          assignmentId: $assignmentId
          contactsFilter: $contactsFilter
        ) {
          id
          messageStatus
          firstName
          lastName
          updatedAt
        }
      }
    `,
    variables: {
      contactsFilter: {
        messageStatus: "needsResponse,convo,closed",
        isOptedOut: false,
        validTimezone: true
      },
      assignmentId: ownProps.params.assignmentId
    },
    fetchPolicy: "network-only",
    pollInterval: 20000
  }
});

export default loadData(withRouter(ConversationTexterComponent), {
  mapQueriesToProps
});
