import types from "prop-types";
import React from "react";
import Check from "material-ui/svg-icons/action/check-circle";
import Empty from "../components/Empty";
import loadData from "./hoc/load-data";
import gql from "graphql-tag";
import { withRouter } from "react-router";
import _ from "lodash";

import AssignmentSummary from "src/components/AssignmentSummary";
import { campaignIsBetweenTextingHours } from "src/lib";

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

  sortSummaries = summaries => {
    return _.sortBy(summaries, [
      s => s.assignment.campaign.status !== "ACTIVE",
      s => s.assignment.campaign.dueBy
    ]);
  };

  renderAssignmentList() {
    const organizationId = this.props.params.organizationId;
    return this.sortSummaries(this.props.data.currentUser.assignmentSummaries)
      .map(summary => {
        const isWithinTextingHours = campaignIsBetweenTextingHours(
          summary.assignment.campaign
        );
        const counts = _.chain(summary.contactCounts)
          .keyBy("messageStatus")
          .mapValues("count")
          .value();
        const unmessagedCount = counts.needsMessage || 0;
        const conversationCount = _.sum([
          0,
          counts.convo,
          counts.needsResponse,
          counts.closed
        ]);
        if (
          !summary.assignment.campaign.useDynamicAssignment &&
          unmessagedCount + conversationCount === 0
        ) {
          return null;
        }
        return (
          <AssignmentSummary
            organizationId={organizationId}
            key={summary.assignment.id}
            assignment={summary.assignment}
            isWithinTextingHours={isWithinTextingHours}
            campaignStatus={summary.assignment.campaign.status}
            unmessagedCount={unmessagedCount}
            conversationCount={conversationCount}
            needsResponseCount={counts.needsResponse || 0}
          />
        );
      })
      .filter(ele => ele !== null);
  }

  render() {
    this.termsAgreed();

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
