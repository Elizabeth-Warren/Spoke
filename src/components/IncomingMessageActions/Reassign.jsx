import React, { Component } from "react";
import type from "prop-types";
import Dialog from "material-ui/Dialog";
import AutoComplete from "material-ui/AutoComplete";
import { css, StyleSheet } from "aphrodite";
import { getHighestRole } from "../../lib/permissions";
import FlatButton from "material-ui/FlatButton";
import RaisedButton from "material-ui/RaisedButton";
import { dataSourceItem } from "../utils";
import theme from "../../styles/theme";

const styles = StyleSheet.create({
  container: {
    ...theme.layouts.multiColumn.container,
    alignContent: "flex-start",
    justifyContent: "flex-start",
    flexWrap: "wrap",
    alignItems: "center"
  },
  flexColumn: {
    display: "flex",
    marginRight: "10px"
  }
});

class Reassign extends Component {
  constructor(props) {
    super(props);

    this.onReassignmentClicked = this.onReassignmentClicked.bind(this);
    this.state = {
      confirmDialogOpen: false
    };
  }

  onReassignmentClicked = () => {
    this.props.onReassignRequested(this.state.reassignTo);
  };

  onReassignAllMatchingClicked = () => {
    this.setState({ confirmDialogOpen: true });
  };

  onReassignChanged = (selection, index) => {
    let texterUserId = undefined;
    if (index === -1) {
      const texter = this.props.people.find(person => {
        this.setState({ reassignTo: undefined });
        return person.displayName === selection;
      });
      if (texter) {
        texterUserId = texter.id;
      }
    } else {
      texterUserId = selection.value.key;
    }
    if (texterUserId) {
      this.setState({ reassignTo: parseInt(texterUserId, 10) });
    } else {
      this.setState({ reassignTo: undefined });
    }
  };

  handleConfirmDialogCancel = () => {
    this.setState({ confirmDialogOpen: false });
  };

  handleConfirmDialogReassign = () => {
    this.setState({ confirmDialogOpen: false });
    this.props.onReassignAllMatchingRequested(this.state.reassignTo);
  };

  render = () => {
    const texterNodes = !this.props.people
      ? []
      : this.props.people.map(user => {
          const userId = parseInt(user.id, 10);
          const label = user.displayName;
          return dataSourceItem(label, userId);
        });
    texterNodes.sort((left, right) => {
      return left.text.localeCompare(right.text, "en", { sensitivity: "base" });
    });

    const confirmDialogActions = [
      <FlatButton
        label="Cancel"
        primary
        onClick={this.handleConfirmDialogCancel}
      />,
      <FlatButton
        label="Reassign"
        primary
        onClick={this.handleConfirmDialogReassign}
      />
    ];

    return (
      <div className={css(styles.container)}>
        <div className={css(styles.flexColumn)}>
          <AutoComplete
            filter={AutoComplete.caseInsensitiveFilter}
            maxSearchResults={8}
            onFocus={() =>
              this.setState({
                reassignTo: undefined,
                texterSearchText: ""
              })
            }
            onUpdateInput={texterSearchText =>
              this.setState({ texterSearchText })
            }
            searchText={this.state.texterSearchText}
            dataSource={texterNodes}
            hintText={"Search for a texter"}
            floatingLabelText={"Reassign to ..."}
            onNewRequest={this.onReassignChanged}
          />
        </div>
        <div className={css(styles.flexColumn)}>
          <RaisedButton
            label={"Reassign selected"}
            onClick={this.onReassignmentClicked}
            disabled={!this.state.reassignTo}
          />
        </div>
        {this.props.conversationCount ? (
          <div className={css(styles.flexColumn)}>
            <RaisedButton
              label={`Reassign all ${this.props.conversationCount} matching`}
              onClick={this.onReassignAllMatchingClicked}
              disabled={!this.state.reassignTo}
            />
          </div>
        ) : (
          ""
        )}
        <Dialog
          actions={confirmDialogActions}
          open={this.state.confirmDialogOpen}
          modal
          onRequestClose={this.handleConfirmDialogCancel}
        >
          {`Reassign all ${this.props.conversationCount} matching conversations?`}
        </Dialog>
      </div>
    );
  };
}

Reassign.propTypes = {
  people: type.array.isRequired,
  onReassignRequested: type.func.isRequired,
  onReassignAllMatchingRequested: type.func.isRequired,
  conversationCount: type.number.isRequired
};

export default Reassign;
