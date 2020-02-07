import type from "prop-types";
import React from "react";
import { List } from "material-ui/List";
import { ToolbarTitle } from "material-ui/Toolbar";
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

  renderCannedResponses({ scripts, subheader, showAddScriptButton }) {
    const { customFields, campaignId, texterId } = this.props;

    return (
      <ScriptList
        texterId={texterId}
        campaignId={campaignId}
        scripts={scripts}
        showAddScriptButton={showAddScriptButton}
        duplicateCampaignResponses
        customFields={customFields}
        subheader={subheader}
        onSelectCannedResponse={this.handleSelectCannedResponse}
      />
    );
  }

  render() {
    const { campaignCannedResponses } = this.props;

    return (
      <List>
        <ToolbarTitle text="Replies" style={styles.title} />
        {this.renderCannedResponses({
          scripts: campaignCannedResponses,
          showAddScriptButton: false
        })}
      </List>
    );
  }
}

CannedResponseMenu.propTypes = {
  scripts: type.array,
  onSelectCannedResponse: type.func,
  customFields: type.array,
  texterId: type.number,
  userCannedResponses: type.array,
  campaignId: type.number,
  campaignCannedResponses: type.array
};

export default CannedResponseMenu;
