import PropTypes from "prop-types";
import React from "react";
import DropDownMenu from "material-ui/DropDownMenu";
import MenuItem from "material-ui/MenuItem";
import { CampaignStatus } from "../lib/campaign-statuses";
const {
  ACTIVE,
  ARCHIVED,
  CLOSED,
  CLOSED_FOR_INITIAL_SENDS,
  NOT_STARTED
} = CampaignStatus;

const STATUSES = {
  ACTIVE: {
    display: "Active",
    value: ACTIVE
  },
  ARCHIVED: {
    display: "Archived",
    value: ARCHIVED
  },
  CLOSED: {
    display: "Closed",
    value: CLOSED
  },
  CLOSED_FOR_INITIAL_SENDS: {
    display: "Closed for Initial Sends",
    value: CLOSED_FOR_INITIAL_SENDS
  },
  NOT_STARTED: {
    display: "Not Started",
    value: NOT_STARTED
  }
};

export const DEFAULT_STATUS_FILTER = STATUSES.ACTIVE.value;

const CampaignStatusSelect = props => {
  const allKeys = Object.keys(STATUSES);
  const statusKeys = props.statusOptions
    ? allKeys.filter(key => props.statusOptions.includes(key))
    : allKeys;

  return (
    <DropDownMenu
      value={props.value || DEFAULT_STATUS_FILTER}
      onChange={props.onChange}
      style={{ minWidth: 220 }}
    >
      {statusKeys.map(key => {
        const status = STATUSES[key];
        return (
          <MenuItem
            value={status.value}
            key={status.value}
            primaryText={status.display}
          />
        );
      })}
    </DropDownMenu>
  );
};

CampaignStatusSelect.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func
};

export default CampaignStatusSelect;
