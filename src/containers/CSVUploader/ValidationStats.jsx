import React from "react";
import { StyleSheet, css } from "aphrodite";
import { Card, List, ListItem, RaisedButton } from "material-ui";
import WarningIcon from "material-ui/svg-icons/alert/warning";
import InfoIcon from "material-ui/svg-icons/action/info";
import ErrorIcon from "material-ui/svg-icons/alert/error";
import DeleteIcon from "material-ui/svg-icons/action/delete";

import theme from "src/styles/theme";
import types from "prop-types";

const styles = StyleSheet.create({
  uploadColumnRight: {
    flex: "1",
    padding: "20px"
  },
  statsCard: {
    padding: "20px",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  }
});
const warningIcon = <WarningIcon color={theme.colors.EWlightRed} />;
const infoIcon = <InfoIcon />;
const errorIcon = <ErrorIcon color={theme.colors.red} />;

export default function ValidationStats({ stats, canDelete, onDelete }) {
  const { nValid, nInvalid, dupeCount, extraColumns } = stats;

  const statLines = [
    {
      text: `${nValid} valid rows`,
      icon: nValid > 0 ? infoIcon : errorIcon
    },
    {
      text: `${nInvalid} invalid rows`,
      icon: nInvalid > 0 ? infoIcon : infoIcon
    },
    {
      text: `${dupeCount} duplicates`,
      icon: dupeCount > 0 ? warningIcon : infoIcon
    },
    {
      text: `Extra Columns: ${extraColumns && extraColumns.join(", ")}`,
      icon: infoIcon
    }
  ];

  return (
    <div className={css(styles.uploadColumnRight)}>
      <Card className={css(styles.statsCard)}>
        <List>
          {statLines.map((stat, index) => (
            <ListItem
              key={index}
              leftIcon={stat.icon}
              innerDivStyle={{ fontSize: "12px" }}
              primaryText={stat.text}
              disabled
            />
          ))}
        </List>
        <div style={{ textAlign: "center" }}>
          <RaisedButton
            label="Discard"
            disabled={!canDelete}
            onClick={() => canDelete && onDelete()}
            icon={<DeleteIcon />}
          />
        </div>
      </Card>
    </div>
  );
}

ValidationStats.propTypes = {
  stats: types.shape({
    nValid: types.number.isRequired,
    nInvalid: types.number.isRequired,
    dupeCount: types.number.isRequired,
    extraColumns: types.arrayOf(types.string).isRequired
  }).isRequired,
  canDelete: types.bool.isRequired,
  onDelete: types.func.isRequired
};
