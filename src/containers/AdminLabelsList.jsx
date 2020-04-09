import types from "prop-types";
import React from "react";
import _ from "lodash";
import gql from "graphql-tag";
import DataTables from "material-ui-datatables";
import checkReady from "src/components/CheckReady";

import { useQuery } from "@apollo/react-hooks";

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

export default function AdminLabelsList(props) {
  const organizationQuery = useQuery(
    gql`
      query getOrganization($organizationId: String!) {
        organization(id: $organizationId) {
          id
          labels {
            id
            displayValue
            slug
            createdAt
            group
          }
        }
      }
    `,
    {
      variables: {
        organizationId: props.params.organizationId
      },
      fetchPolicy: "network-only",
      pollInterval: 60000
    }
  );

  const notReady = checkReady(organizationQuery);
  if (notReady) {
    return notReady;
  }

  const { labels } = organizationQuery.data.organization;

  return (
    <DataTables
      data={_.sortBy(labels, l => [l.group, l.displayValue])}
      columns={labelListColumns}
      rowSize={labels.length}
      count={labels.length}
      showRowHover={true}
      showFooterToolbar={false}
      showRowHover={true}
    />
  );
}

AdminLabelsList.propTypes = {
  params: types.object
};
