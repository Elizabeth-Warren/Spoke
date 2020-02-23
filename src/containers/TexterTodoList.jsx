import types from "prop-types";
import React from "react";
import Check from "material-ui/svg-icons/action/check-circle";
import Empty from "../components/Empty";
import loadData from "./hoc/load-data";
import gql from "graphql-tag";
import { withRouter } from "react-router";
import _ from "lodash";

import AssignmentSummary from "src/components/AssignmentSummary";

class TexterTodoList extends React.Component {
  static propTypes = {
    organizationId: types.string,
    params: types.object,
    data: types.object,
    router: types.object
  };

  constructor(props) {
    super(props);
  }

  termsAgreed() {
    const { data, router } = this.props;
    if (window.TERMS_REQUIRE && !data.currentUser.terms) {
      router.push(`/terms?next=${this.props.location.pathname}`);
    }
  }

  getCounts(contactCounts) {
    return _.chain(contactCounts)
      .keyBy("messageStatus")
      .mapValues("count")
      .value();
  }
  sortSummaries = summaries => {
    const hasNewMessages = contactCounts => {
      const counts = this.getCounts(contactCounts);
      return counts.needsMessage || 0;
    };
    const needsResponse = contactCounts => {
      const counts = this.getCounts(contactCounts);
      return counts.needsResponse || 0;
    };

    return _.orderBy(
      summaries,
      [
        s => s.assignment.campaign.status !== "ACTIVE",
        s => !!hasNewMessages(s.contactCounts),
        s => !!needsResponse(s.contactCounts),
        s => new Date(s.assignment.campaign.startedAt)
      ],
      ["asc", "desc", "desc", "desc"]
    );
  };

  renderAssignmentList() {
    const organizationId = this.props.params.organizationId;
    return this.sortSummaries(this.props.data.currentUser.assignmentSummaries)
      .map(summary => (
        <AssignmentSummary
          organizationId={organizationId}
          key={summary.assignment.id}
          assignment={summary.assignment}
          contactCounts={summary.contactCounts}
        />
      ))
      .filter(ele => ele !== null);
  }

  render() {
    if (this.props.data.errors && this.props.params.organizationId) {
      return null;
    }

    const renderedAssignments = this.renderAssignmentList();
    const empty = <Empty title="You have nothing to do!" icon={<Check />} />;

    return (
      <div>
        {renderedAssignments.length === 0 ? empty : renderedAssignments}
      </div>
    );
  }
}

const mapQueriesToProps = ({ ownProps }) => ({
  data: {
    query: gql`
      query getTodos($organizationId: String!) {
        currentUser {
          id
          terms
          assignmentSummaries(organizationId: $organizationId) {
            assignment {
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
                startedAt
                status
                logoImageUrl
                timezone
                overrideOrganizationTextingHours
                textingHoursStart
                textingHoursEnd
                textingHoursEnforced
                organization {
                  id
                  textingHoursEnforced
                  textingHoursStart
                  textingHoursEnd
                }
              }
            }
            contactCounts {
              messageStatus
              count
            }
          }
        }
      }
    `,
    variables: {
      organizationId: ownProps.params.organizationId
    },
    fetchPolicy: "network-only",
    pollInterval: 10000
  }
});

export default loadData(withRouter(TexterTodoList), { mapQueriesToProps });
