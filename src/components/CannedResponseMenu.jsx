import type from "prop-types";
import React from "react";
import { List } from "material-ui/List";
import ScriptList from "./ScriptList";
import theme from "../styles/theme";

const styles = {
  title: {
    color: theme.colors.EWnavy,
    paddingLeft: 16
  }
};

class CannedResponseMenu extends React.Component {
  constructor(props) {
    super(props);
  }

  handleSelectCannedResponse = cannedResponse => {
    const { onSelectCannedResponse } = this.props;
    onSelectCannedResponse(cannedResponse);
  };

  renderCannedResponses({ scripts }) {
    return (
      <ScriptList
        scripts={scripts}
        onSelectCannedResponse={this.handleSelectCannedResponse}
      />
    );
  }

  render() {
    const { campaignCannedResponses } = this.props;

    return (
      <div style={{ height: "100%", overflowY: "auto" }}>
        <List>
          {this.renderCannedResponses({
            scripts: campaignCannedResponses,
            showAddScriptButton: false
          })}
        </List>
      </div>
    );
  }
}

CannedResponseMenu.propTypes = {
  onSelectCannedResponse: type.func,
  campaignCannedResponses: type.array
};

export default CannedResponseMenu;
