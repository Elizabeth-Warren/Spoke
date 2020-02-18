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

export default function ValidationStats(props) {
  const {
    nContacts,
    nResponses,
    customFields,
    stats,
    canDelete,
    onDelete
  } = props;
  const {
    dupeCount,
    missingCellCount,
    invalidCellCount,
    missingFieldCount,
    invalidFieldCount,
    invalidCustomFields
  } = stats;

  const statLines = [
    {
      key: "nContacts",
      text: `${nContacts} valid contacts`,
      icon: nContacts > 0 ? infoIcon : errorIcon
    },
    {
      key: "nResponses",
      text: `${nResponses} valid responses`,
      icon: nResponses > 0 ? infoIcon : errorIcon
    },
    {
      key: "dupeCount",
      text: `${dupeCount} duplicates`,
      icon: dupeCount > 0 ? warningIcon : infoIcon
    },
    {
      key: "missingCellCount",
      text: `${missingCellCount} rows with missing numbers`,
      icon: missingCellCount > 0 ? warningIcon : infoIcon
    },
    {
      key: "invalidCellCount",
      text: `${invalidCellCount} rows with invalid numbers`,
      icon: invalidCellCount > 0 ? warningIcon : infoIcon
    },
    {
      key: "customFields",
      text: `Custom fields: ${customFields && customFields.join(", ")}`,
      icon: infoIcon
    },

    {
      key: "missingFieldCount",
      text: `${missingFieldCount} rows with missing body or title`,
      icon: missingFieldCount > 0 ? warningIcon : infoIcon
    },
    {
      key: "invalidFieldCount",
      text: `${invalidFieldCount} rows with invalid fields`,
      icon: invalidCellCount > 0 ? warningIcon : infoIcon
    },
    {
      key: "invalidCustomFields",
      text: `Invalid custom fields: ${invalidCustomFields &&
        invalidCustomFields.join(", ")}`,
      icon: infoIcon
    }
  ];

  return (
    <div className={css(styles.uploadColumnRight)}>
      <Card className={css(styles.statsCard)}>
        <List>
          {statLines.map((stat, index) => {
            const hasStat = !!stats[stat.key] || !!props[stat.key];
            return (
              hasStat && (
                <ListItem
                  key={index}
                  leftIcon={stat.icon}
                  innerDivStyle={{ fontSize: "12px" }}
                  primaryText={stat.text}
                  disabled
                />
              )
            );
          })}
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
  nContacts: types.number,
  customFields: types.arrayOf(types.string),
  stats: types.shape({
    dupeCount: types.number,
    missingCellCount: types.number,
    invalidCellCount: types.number
  }),
  canDelete: types.bool.isRequired,
  onDelete: types.func.isRequired
};
