import React from "react";
import PropTypes from "prop-types";
import { StyleSheet, css } from "aphrodite";
import { List, ListItem } from "material-ui/List";
import Divider from "material-ui/Divider";
import theme from "src/styles/theme";

import LabelChips from "src/components/LabelChips";

const inlineStyles = {
  responseContainer: {
    paddingBottom: 32,
    flexGrow: 1,
    overflow: "auto"
  }
};

const styles = StyleSheet.create({
  listSubheader: {
    fontSize: 14
  },
  chipList: {
    display: "flex"
  },
  title: {
    marginTop: 0
  }
});

export default function ScriptList({ scripts, onSelectCannedResponse }) {
  return (
    <div style={inlineStyles.responseContainer}>
      {!!scripts.length && (
        <List>
          {scripts.map(script => (
            <ListItem
              value={script.text}
              key={script.id}
              onClick={() => onSelectCannedResponse(script)}
            >
              <p className={css(styles.title)}>{script.title}</p>
              <p className={css(styles.listSubheader)}>{script.text}</p>
              <div className={css(styles.chipList)}>
                <LabelChips
                  labelIds={script.labels.map(({ id }) => id)}
                  labels={script.labels}
                />
              </div>
            </ListItem>
          ))}
          <Divider />
        </List>
      )}
    </div>
  );
}

ScriptList.propTypes = {
  scripts: PropTypes.arrayOf(PropTypes.object),
  onSelectCannedResponse: PropTypes.func
};
