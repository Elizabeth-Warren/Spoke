import PropTypes from "prop-types";
import React, { Component } from "react";
import { withRouter } from "react-router";

import loadData from "src/containers/hoc/load-data";
import wrapMutations from "src/containers/hoc/wrap-mutations";
import gql from "graphql-tag";
import InitialMessageTexterContact from "./InitialMessageTexterContact";
import Empty from "src/components/Empty";
import Check from "material-ui/svg-icons/action/check-circle";
import RaisedButton from "material-ui/RaisedButton";
import _ from "lodash";
import { getTopMostParent, campaignIsBetweenTextingHours } from "src/lib";
import { applyScript } from "src/lib/scripts";
import { checkForErrorCode } from "src/client/lib/error-helpers";

const contactDataFragment = `
        id
        assignmentId
        firstName
        lastName
        customFields
`;

class InitialMessageTexter extends Component {
  static propTypes = {
    params: PropTypes.object,
    data: PropTypes.object,
    mutations: PropTypes.object,
    router: PropTypes.object
  };

  constructor(props) {
    super(props);
    this.state = {
      contactsMessaged: new Set(),
      loading: false
    };
  }

  exitTexter = () => {
    this.props.router.push("/app/" + (this.props.params.organizationId || ""));
  };

  // TODO: shared code
  getMessageTextFromScript = (script, contact) => {
    const { campaign, texter } = this.props.data.assignment;

    return script
      ? applyScript({
          contact,
          texter,
          script,
          customFields: campaign.customFields
        })
      : null;
  };

  getStartingMessageText = contact => {
    const { campaign } = this.props.data.assignment;
    return this.getMessageTextFromScript(
      getTopMostParent(campaign.interactionSteps).script,
      contact
    );
  };

  campaignIsBetweenTextingHours() {
    const { campaign } = this.props.data.assignment;
    return campaignIsBetweenTextingHours(campaign);
  }

  sendMessage = async (messageInput, contactId) => {
    if (this.state.contactsMessaged.has(contactId)) {
      throw new Error("Duplicate message send detected");
    }

    if (this.isSending) {
      return;
    }

    this.isSending = true;

    try {
      const response = await this.props.mutations.sendMessage(
        messageInput,
        contactId
      );
      // This can happen if a user has the initial message texter open in multiple windows
      const dupMessage = checkForErrorCode(response, "DUPLICATE_MESSAGE");
      if (dupMessage) {
        window.location.reload();
      }
    } catch (e) {
      console.error("Error sending message", e);
      this.exitTexter();
    } finally {
      this.isSending = false;

      this.setState({
        contactsMessaged: this.state.contactsMessaged.add(contactId)
      });

      const areContactsLeft = (this.props.data.assignment.contacts || []).find(
        c => !this.state.contactsMessaged.has(c.id)
      );

      if (!areContactsLeft) {
        this.props.router.push(
          `/app/${this.props.params.organizationId}/todos/${this.props.params.assignmentId}/conversations`
        );
      }
    }
  };

  renderEmpty = () => {
    return (
      <div>
        <Empty
          title="You have nothing left to do."
          icon={<Check />}
          content={
            <div>
              <RaisedButton label="Back To Todos" onClick={this.exitTexter} />
            </div>
          }
        />
      </div>
    );
  };

  render = () => {
    const { assignment } = this.props.data;
    if (!assignment) {
      // TODO: real 404 page
      this.props.router.push(`/404`);
      return null;
    }

    if (!this.campaignIsBetweenTextingHours()) {
      // TODO: more feedback if out of texting hours, this redirects to todos, which should
      //   grey out the send messages button.
      this.exitTexter();
      return null;
    }

    const contacts = (assignment.contacts || []).filter(
      contact => !this.state.contactsMessaged.has(contact.id)
    );

    if (contacts.length === 0) {
      return this.renderEmpty();
    }

    const currentContact = _.sortBy(contacts, "id")[0];
    const { campaign, texter } = assignment;
    return (
      <InitialMessageTexterContact
        contactsRemaining={contacts.length}
        contact={currentContact}
        campaign={campaign}
        assignment={assignment} // TODO: shouldn't need to drill assignment down
        messageText={this.getStartingMessageText(currentContact)}
        texter={texter}
        sendMessage={this.sendMessage}
        exitTexter={this.exitTexter}
      />
    );
  };
}

const mapQueriesToProps = ({ ownProps }) => ({
  data: {
    query: gql`
      query getContactsForInitialMessageTexter(
        $assignmentId: String!
        $contactsFilter: ContactsFilter!
      ) {
        assignment(id: $assignmentId) {
          id
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
            ${contactDataFragment}
          }
          allContactsCount: contactsCount
        }
      }
    `,
    variables: {
      contactsFilter: {
        messageStatus: "needsMessage",
        isOptedOut: false,
        validTimezone: true
      },
      assignmentId: ownProps.params.assignmentId
    }
  }
});

const mapMutationsToProps = () => ({
  sendMessage: (message, campaignContactId) => ({
    mutation: gql`
      mutation sendMessage(
        $message: MessageInput!
        $campaignContactId: String!
      ) {
        sendMessage(message: $message, campaignContactId: $campaignContactId) {
          id
          messageStatus
          messages {
            id
            createdAt
            text
          }
        }
      }
    `,
    variables: {
      message,
      campaignContactId
    }
  })
});

export default loadData(wrapMutations(withRouter(InitialMessageTexter)), {
  mapQueriesToProps,
  mapMutationsToProps
});
