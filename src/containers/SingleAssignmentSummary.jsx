import types from "prop-types";
import React from "react";
import gql from "graphql-tag";
import { withRouter } from "react-router";

import RaisedButton from "material-ui/RaisedButton";

import AssignmentSummary from "src/components/AssignmentSummary";

import loadData from "./hoc/load-data";

function SingleAssignmentSummary({ data: { assignment }, router }) {
  const organizationId = assignment.campaign.organization.id;
  return (
    <div>
      <AssignmentSummary
        organizationId={organizationId}
        assignment={assignment}
        contactCounts={assignment.contactCounts}
      />
      <div style={{ textAlign: "center", marginTop: "100px" }}>
        <RaisedButton
          label="All Todos"
          onClick={() => router.push(`/app/${organizationId}/todos`)}
        />
      </div>
    </div>
  );
}

SingleAssignmentSummary.propTypes = {
  organizationId: types.string,
  params: types.object,
  data: types.object,
  router: types.object
};

const mapQueriesToProps = ({ ownProps }) => ({
  data: {
    query: gql`
      query getAssignment($assignmentId: String!) {
        assignment(id: $assignmentId) {
          id
          contactCounts {
            messageStatus
            count
          }
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
      }
    `,
    variables: {
      assignmentId: ownProps.params.assignmentId
    },
    fetchPolicy: "network-only",
    pollInterval: 10000
  }
});

export default loadData(withRouter(SingleAssignmentSummary), {
  mapQueriesToProps
});
