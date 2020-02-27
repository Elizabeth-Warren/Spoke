import types from "prop-types";
import React from "react";
import { withRouter } from "react-router";
import _ from "lodash";
import loadData from "./hoc/load-data";
import gql from "graphql-tag";
import DataTables from "material-ui-datatables";

const labelListColumns = [
  {
    key: "group",
    label: "Group",
    style: {
      textOverflow: "ellipsis",
      overflow: "hidden",
      whiteSpace: "pre-line"
    }
  },
  {
    key: "displayValue",
    label: "Display Value",
    style: {
      textOverflow: "ellipsis",
      overflow: "hidden",
      whiteSpace: "pre-line"
    }
  },
  {
    key: "slug",
    label: "Import Name",
    style: {
      textOverflow: "ellipsis",
      overflow: "hidden",
      whiteSpace: "pre-line"
    }
  }
];

function AdminLabelsList(props) {
  if (!props.organizationData.organization) {
    return null;
  }

  const { labels } = props.organizationData.organization;

  return (
    <DataTables
      data={_.sortBy(labels, l => [l.group, l.displayValue])}
      columns={labelListColumns}
      rowSize={labels.length}
      count={labels.length}
      showFooterToolbar={false}
    />
  );
}

AdminLabelsList.propTypes = {
  organizationData: types.object
};

const mapQueriesToProps = ({ ownProps }) => ({
  organizationData: {
    query: gql`
      query getOrganization($organizationId: String!) {
        organization(id: $organizationId) {
          id
          labels {
            id
            displayValue
            slug
            createdAt
            group
            createdBy {
              id
            }
          }
        }
      }
    `,
    variables: {
      organizationId: ownProps.params.organizationId
    },
    fetchPolicy: "network-only",
    pollInterval: 60000
  }
});

export default loadData(AdminLabelsList, { mapQueriesToProps });
