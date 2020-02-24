import PropTypes from "prop-types";
import React from "react";
import { List, ListItem } from "material-ui/List";
import Divider from "material-ui/Divider";

const styles = {
  responseContainer: {
    paddingBottom: 32,
    flexGrow: 1,
    overflow: "auto"
  }
};

export default class ScriptList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      script: props.script
    };
  }

  render() {
    const { scripts, onSelectCannedResponse } = this.props;

    const rightIconButton = null;
    const listItems = scripts.map(script => {
      const title = script.surveyQuestion
        ? `[${script.surveyQuestion}] ${script.title}`
        : script.title;
      return (
        <ListItem
          value={script.text}
          onClick={() => onSelectCannedResponse(script)}
          key={script.id}
          primaryText={title}
          secondaryText={script.text}
          rightIconButton={rightIconButton}
          secondaryTextLines={2}
        />
      );
    });

    const list =
      scripts.length === 0 ? null : (
        <List>
          {listItems}
          <Divider />
        </List>
      );

    return <div style={styles.responseContainer}>{list}</div>;
  }
}

ScriptList.propTypes = {
  script: PropTypes.object,
  scripts: PropTypes.arrayOf(PropTypes.object),
  onSelectCannedResponse: PropTypes.func
};
