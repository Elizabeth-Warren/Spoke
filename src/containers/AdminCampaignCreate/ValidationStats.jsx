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

export default function ValidationStats({
  nContacts,
  customFields,
  stats,
  canDelete,
  onDelete
}) {
  const { dupeCount, missingCellCount, invalidCellCount } = stats;

  const statLines = [
    {
      text: `${nContacts} valid contacts`,
      icon: nContacts > 0 ? infoIcon : errorIcon
    },
    {
      text: `${dupeCount} duplicates`,
      icon: dupeCount > 0 ? warningIcon : infoIcon
    },
    {
      text: `${missingCellCount} rows with missing numbers`,
      icon: missingCellCount > 0 ? warningIcon : infoIcon
    },
    {
      text: `${invalidCellCount} rows with invalid numbers`,
      icon: invalidCellCount > 0 ? warningIcon : infoIcon
    },
    {
      text: `Custom fields: ${customFields.join(", ")}`,
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
  nContacts: types.number.isRequired,
  customFields: types.arrayOf(types.string).isRequired,
  stats: types.shape({
    dupeCount: types.number.isRequired,
    missingCellCount: types.number.isRequired,
    invalidCellCount: types.number.isRequired
  }).isRequired,
  canDelete: types.bool.isRequired,
  onDelete: types.func.isRequired
};
