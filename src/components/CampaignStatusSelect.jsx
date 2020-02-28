import PropTypes from "prop-types";
import React from "react";
import DropDownMenu from "material-ui/DropDownMenu";
import MenuItem from "material-ui/MenuItem";
import { CampaignStatusValues } from "../lib/campaign-statuses";

export const DEFAULT_STATUS_FILTER = CampaignStatusValues.ACTIVE.value;

const CampaignStatusSelect = props => {
  const allKeys = Object.keys(CampaignStatusValues);
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
        const status = CampaignStatusValues[key];
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
