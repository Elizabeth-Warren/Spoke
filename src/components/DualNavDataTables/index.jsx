import DataTables from "material-ui-datatables";
import React from "react";
import withPagination from "../Paginated/withPagination";

const DualNavDataTables = props => (
  <DataTables {...props} showFooterToolbar={false} showRowHover={true} />
);

export default withPagination(DualNavDataTables, true, true);
