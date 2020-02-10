import type from "prop-types";
import React from "react";
import { List } from "material-ui/List";
import ScriptList from "./ScriptList";
import theme from "../styles/theme";
import TextField from "material-ui/TextField";
import { searchFor } from "../lib/search-helpers";

const styles = {
  title: {
    color: theme.colors.EWnavy,
    paddingLeft: 16
  },
  searchField: {
    margin: "10px 20px"
  }
};

class CannedResponseMenu extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      results: []
    };
  }

  handleSelectCannedResponse = cannedResponse => {
    const { onSelectCannedResponse } = this.props;
    onSelectCannedResponse(cannedResponse);
  };

  componentDidMount() {
    this.setState({ results: this.props.campaignCannedResponses });
  }
  handleOnChange(e) {
    const searchValue = e.target.value;
    const { campaignCannedResponses } = this.props;
    const keysToSearch = ["surveyQuestion", "text", "title"];
    const results = searchFor(
      searchValue,
      campaignCannedResponses,
      keysToSearch
    );
    this.setState({ results });
  }

  renderCannedResponses({ scripts }) {
    return (
      <div>
        <TextField
          style={styles.searchField}
          hintText="Search replies..."
          onChange={e => this.handleOnChange(e)}
        />
        <ScriptList
          scripts={scripts}
          onSelectCannedResponse={this.handleSelectCannedResponse}
        />
      </div>
    );
  }

  render() {
    const { campaignCannedResponses } = this.props;

    return (
      <div style={{ height: "100%", overflowY: "auto" }}>
        <List>
          {this.renderCannedResponses({
            scripts: this.state.results,
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
