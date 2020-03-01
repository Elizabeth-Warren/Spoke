import React, { useState } from "react";
import PropTypes from "prop-types";
import Divider from "material-ui/Divider";
import CopyIcon from "material-ui/svg-icons/content/content-copy";
import IconButton from "material-ui/IconButton";
import Snackbar from "material-ui/Snackbar";
import { List } from "react-virtualized";
import AutoSizer from "react-virtualized-auto-sizer";

import CannedResponseListItem from "src/components/CannedResponseListItem";

const inlineStyles = {
  responseContainer: {
    paddingBottom: 32,
    flexGrow: 1,
    overflow: "auto"
  }
};
export default function ScriptList({ scripts, onSelectCannedResponse }) {
  const [showCopySnackbar, setShowCopySnackbar] = useState(false);

  function Row({ index, style, key }) {
    const script = scripts[index];
    return (
      <div key={key} style={style}>
        <CannedResponseListItem
          key={script.id}
          response={script}
          labels={script.labels}
          onClick={() => onSelectCannedResponse(script)}
        />
      </div>
    );
  }

  return (
    <div style={inlineStyles.responseContainer}>
      {!!scripts.length && (
        <AutoSizer>
          {({ height, width }) => (
            <List
              height={height}
              rowCount={scripts.length}
              rowHeight={250}
              width={width}
              rowRenderer={Row}
            />
          )}
        </AutoSizer>
      )}
      <Snackbar
        open={showCopySnackbar}
        message="Response copied to the clipboard"
        autoHideDuration={2000}
        onRequestClose={() => {
          setShowCopySnackbar(false);
        }}
      />
    </div>
  );
}

ScriptList.propTypes = {
  scripts: PropTypes.arrayOf(PropTypes.object),
  onSelectCannedResponse: PropTypes.func
};
