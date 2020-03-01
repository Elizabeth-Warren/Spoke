import React from "react";
import { StyleSheet, css } from "aphrodite";
import types from "prop-types";

import { ListItem } from "material-ui/List";

import LabelChips from "./LabelChips";

const styles = StyleSheet.create({
  listItem: {
    position: "relative",
    height: "250px",
    overflow: "hidden"
  },
  titleWrapper: {
    display: "flex",
    height: "30px",
    margin: 0,
    position: "absolute",
    top: 20,
    width: "calc(100% - 50px)"
  },
  title: {
    fontWeight: "bold",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    minWidth: 0
  },
  body: {
    fontSize: 14,
    height: "200px",
    margin: 0,
    overflow: "hidden",
    position: "absolute",
    top: "50px"
  },
  bodyFade: {
    position: "absolute",
    top: "150px",
    width: "100%",
    height: "100px"
  },
  chipsWrapper: {
    height: "200px",
    margin: 0,
    overflow: "hidden",
    position: "absolute",
    top: "50px",
    display: "flex"
  },
  chipsWrapperInner: {
    alignSelf: "flex-end"
  }
});

export default function CannedResponseListItem({
  response,
  labels,
  labelIds,
  leftIcon,
  rightIconButton,
  onClick
}) {
  let mappedLabelIds;
  if (labelIds != null) {
    // list of label ids passed; use that
    mappedLabelIds = labelIds;
  } else {
    // no list of label ids; use all labels
    mappedLabelIds = labels.map(l => l.id);
  }

  return (
    <ListItem
      value={response.text}
      key={response.id}
      leftIcon={leftIcon}
      rightIconButton={rightIconButton}
      onClick={onClick}
      secondaryTextLines={2}
      className={css(styles.listItem)}
      // hoverColor="rgba(0, 0, 0, 0)"
    >
      <div className={css(styles.titleWrapper)}>
        <div className={css(styles.title)}>{response.title}</div>
      </div>
      <div className={css(styles.body)}>{response.text}</div>
      {/* <div
        className={css(styles.bodyFade)}
        style={{
          backgroundImage: `linear-gradient(rgba(255, 255, 255, 0), rgba(255, 255, 255, 1))`
        }}
      /> */}
      <div className={css(styles.chipsWrapper)}>
        <div className={css(styles.chipsWrapperInner)}>
          <LabelChips labels={labels} labelIds={mappedLabelIds} />
        </div>
      </div>
    </ListItem>
  );
}

CannedResponseListItem.propTypes = {
  response: types.object,
  labels: types.arrayOf(types.object),
  labelIds: types.arrayOf(types.string),
  leftIcon: types.node,
  rightIconButton: types.node,
  onClick: types.func
};
