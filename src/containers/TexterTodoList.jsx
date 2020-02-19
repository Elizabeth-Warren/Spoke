import PropTypes from "prop-types";
import React from "react";
import Check from "material-ui/svg-icons/action/check-circle";
import Empty from "../components/Empty";
import loadData from "./hoc/load-data";
import gql from "graphql-tag";
import { withRouter } from "react-router";

import AssignmentSummary from "src/components/AssignmentSummary";
class TexterTodoList extends React.Component {
  constructor(props) {
    super(props);
    this.state = { polling: null };
  }

  renderTodoList(assignments) {
    const organizationId = this.props.params.organizationId;
    return assignments
      .slice(0)
      .sort((x, y) => {
        const xToText = x.unmessagedCount + x.unrepliedCount;
        const yToText = y.unmessagedCount + y.unrepliedCount;
        if (xToText === yToText) {
          return Number(y.id) - Number(x.id);
        }
        return xToText > yToText ? -1 : 1;
      })
      .map(assignment => {
        if (
          assignment.unmessagedCount > 0 ||
          assignment.conversationCount > 0 ||
          assignment.badTimezoneCount > 0 ||
          assignment.campaign.useDynamicAssignment ||
          assignment.skippedMessagesCount > 0
        ) {
          return (
            <AssignmentSummary
              organizationId={organizationId}
              key={assignment.id}
              assignment={assignment}
              unmessagedCount={assignment.unmessagedCount}
              conversationCount={assignment.conversationCount}
              badTimezoneCount={assignment.badTimezoneCount}
              skippedMessagesCount={assignment.skippedMessagesCount}
            />
          );
        }
        return null;
      })
      .filter(ele => ele !== null);
  }

  componentWillUnmount() {
    if (this.state.polling) {
      clearInterval(this.state.polling);
      this.setState({ polling: null });
    }
  }

  termsAgreed() {
    const { data, router } = this.props;
    if (window.TERMS_REQUIRE && !data.currentUser.terms) {
      router.push(`/terms?next=${this.props.location.pathname}`);
    }
  }

  render() {
    this.termsAgreed();

    if (this.props.data.errors && this.props.params.organizationId) {
      this.props.router.push(
        `/app/${this.props.params.organizationId}/suspended`
      );
      return null;
    }

    const todos = this.props.data.currentUser.todos;
    const renderedTodos = this.renderTodoList(todos);

    const empty = <Empty title="You have nothing to do!" icon={<Check />} />;

    return <div>{renderedTodos.length === 0 ? empty : renderedTodos}</div>;
  }
}

TexterTodoList.propTypes = {
  organizationId: PropTypes.string,
  params: PropTypes.object,
  data: PropTypes.object,
  router: PropTypes.object
};

const mapQueriesToProps = ({ ownProps }) => ({
  data: {
    query: gql`
      query getTodos(
        $organizationId: String!
        $needsMessageFilter: ContactsFilter
        $conversationFilter: ContactsFilter
        $badTimezoneFilter: ContactsFilter
        $skippedMessagesFilter: ContactsFilter
      ) {
        currentUser {
          id
          terms
          cacheable
          todos(organizationId: $organizationId) {
            id
            campaign {
              id
              title
              description
              useDynamicAssignment
              hasUnassignedContactsForTexter
              introHtml
              primaryColor
              dueBy
              logoImageUrl
            }
            maxContacts
            unmessagedCount: contactsCount(contactsFilter: $needsMessageFilter)
            conversationCount: contactsCount(
              contactsFilter: $conversationFilter
            )
            badTimezoneCount: contactsCount(contactsFilter: $badTimezoneFilter)
            skippedMessagesCount: contactsCount(
              contactsFilter: $skippedMessagesFilter
            )
          }
        }
      }
    `,
    variables: {
      organizationId: ownProps.params.organizationId,
      needsMessageFilter: {
        messageStatus: "needsMessage",
        isOptedOut: false,
        validTimezone: true
      },
      badTimezoneFilter: {
        isOptedOut: false,
        validTimezone: false
      },
      conversationFilter: {
        messageStatus: "needsResponse,convo",
        isOptedOut: false,
        validTimezone: true
      },
      skippedMessagesFilter: {
        messageStatus: "closed",
        isOptedOut: false,
        validTimezone: true
      }
    },
    pollInterval: 5000
  }
});

export default loadData(withRouter(TexterTodoList), { mapQueriesToProps });
