import React from "react";
import types from "prop-types";
import { StyleSheet, css } from "aphrodite";
import RadioButtonUncheckedIcon from "material-ui/svg-icons/toggle/radio-button-unchecked";
import CheckCircleIcon from "material-ui/svg-icons/action/check-circle";
import WarningIcon from "material-ui/svg-icons/alert/warning";
import ErrorIcon from "material-ui/svg-icons/alert/error";
import HighlightOffIcon from "material-ui/svg-icons/action/highlight-off";

import theme from "src/styles/theme";

const styles = StyleSheet.create({
  columnNameWrapper: {
    display: "flex",
    alignItems: "center",
    marginBottom: "10px"
  },
  columnName: {
    paddingLeft: "10px",
    marginTop: "-4px",
    flex: "1"
  },
  columnNameTitle: {
    fontFamily: "monospace",
    fontWeight: "bold"
  },
  columnNameIcon: {
    paddingRight: "10px"
  }
});

const icons = {
  required: {
    present: <CheckCircleIcon color={theme.colors.EWdarkLibertyGreen} />,
    notPresent: <ErrorIcon color={theme.colors.EWred} />
  },
  suggested: {
    present: <CheckCircleIcon color={theme.colors.EWdarkLibertyGreen} />,
    notPresent: <WarningIcon color={theme.colors.EWlightRed} />
  },
  optional: {
    present: <CheckCircleIcon />,
    notPresent: <HighlightOffIcon />
  }
};

export default function ColumnName({ name, desc, present, type }) {
  let icon;
  if (present == null) {
    icon = <RadioButtonUncheckedIcon />;
  } else {
    icon = icons[type][present ? "present" : "notPresent"];
  }

  return (
    <div className={css(styles.columnNameWrapper)}>
      {icon}
      <div className={css(styles.columnName)}>
        <span className={css(styles.columnNameTitle)}>{name}</span>: {desc}
      </div>
    </div>
  );
}

ColumnName.propTypes = {
  name: types.string,
  desc: types.string,
  present: types.bool,
  type: types.string
};
