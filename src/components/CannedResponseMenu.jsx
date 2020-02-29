import type from "prop-types";
import React from "react";
import { List } from "material-ui/List";
import ScriptList from "./ScriptList";
import theme from "../styles/theme";
import TextField from "material-ui/TextField";
import { searchFor } from "../lib/search-helpers";

const styles = {
  searchWrapper: {
    width: "100%",
    boxSizing: "border-box",
    padding: "10px 20px",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    height: "100%"
  },
  searchStyle: {
    backgroundColor: theme.colors.white,
    border: `2px solid ${theme.colors.EWnavy}`,
    borderRadius: 8,
    color: theme.colors.EWnavy,
    boxSizing: "border-box",
    padding: "0px 10px"
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
    const keysToSearch = [
      "surveyQuestion",
      "text",
      "title",
      r => (r.labels || []).map(l => l.displayValue).join(" ")
    ];
    const results = searchFor(
      searchValue,
      campaignCannedResponses,
      keysToSearch
    );
    this.setState({ results });
  }

  render() {
    return (
      <div style={styles.searchWrapper}>
        <TextField
          type="search"
          style={styles.searchStyle}
          underlineShow={false}
          hintText="Search replies..."
          onChange={e => this.handleOnChange(e)}
          fullWidth
        />
        <ScriptList
          scripts={this.state.results}
          onSelectCannedResponse={this.handleSelectCannedResponse}
        />
      </div>
    );
  }
}

CannedResponseMenu.propTypes = {
  onSelectCannedResponse: type.func,
  campaignCannedResponses: type.array
};

export default CannedResponseMenu;
