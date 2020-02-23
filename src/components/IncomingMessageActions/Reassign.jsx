import React, { Component } from "react";
import type from "prop-types";
import Dialog from "material-ui/Dialog";
import AutoComplete from "material-ui/AutoComplete";
import { css, StyleSheet } from "aphrodite";
import FlatButton from "material-ui/FlatButton";
import RaisedButton from "material-ui/RaisedButton";
import { dataSourceItem } from "../utils";
import theme from "../../styles/theme";
import { CircularProgress } from "material-ui";
import gql from "graphql-tag";
import _ from "lodash";
import ApolloClient from "src/network/apollo-client-singleton";

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
  },
  searchColumn: {
    position: "relative"
  },
  loadingIndicator: {
    position: "absolute",
    right: 0,
    top: "20px"
  }
});

class Reassign extends Component {
  constructor(props) {
    super(props);

    this.onReassignmentClicked = this.onReassignmentClicked.bind(this);
    this.state = {
      confirmDialogOpen: false,
      texters: []
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
      const texter = this.state.texters.find(
        person => person.displayName === selection
      );
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

  handleUpdateInput = texterSearchText => {
    if (texterSearchText.length < 2) {
      this.setState({
        texterSearchText,
        loading: false,
        texters: []
      });
      return;
    }

    this.setState({ texterSearchText, loading: true, texters: [] });
    this.searchForUsers(texterSearchText);
  };

  searchForUsers = _.debounce(texterSearchText => {
    const qres = ApolloClient.query({
      query: gql`
        query getUsers(
          $organizationId: String!
          $cursor: OffsetLimitCursor
          $sortBy: SortPeopleBy
          $filterString: String
          $filterBy: FilterPeopleBy
        ) {
          people(
            organizationId: $organizationId
            cursor: $cursor
            sortBy: $sortBy
            filterString: $filterString
            filterBy: $filterBy
          ) {
            ... on PaginatedUsers {
              pageInfo {
                offset
                limit
                total
              }
              users {
                id
                displayName
                email
              }
            }
          }
        }
      `,
      fetchPolicy: "network-only",
      variables: {
        organizationId: this.props.organizationId,
        cursor: {
          offset: 0,
          limit: 8
        },
        sortBy: "FIRST_NAME",
        filterBy: "ANY",
        filterString: texterSearchText
      }
    }).then(res => {
      if (this.state.texterSearchText !== texterSearchText) {
        return;
      }

      const {
        data: {
          people: { users }
        }
      } = res;

      this.setState({
        loading: false,
        texters: users
      });
    });

    console.log(qres);
  }, 250);

  render = () => {
    const texterNodes = this.state.texters.map(user => {
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
        <div className={css(styles.flexColumn, styles.searchColumn)}>
          <AutoComplete
            filter={() => true}
            maxSearchResults={8}
            onFocus={() =>
              this.setState({
                reassignTo: undefined,
                texterSearchText: ""
              })
            }
            onUpdateInput={this.handleUpdateInput}
            searchText={this.state.texterSearchText}
            dataSource={texterNodes}
            hintText={"Search for a texter"}
            floatingLabelText={"Reassign to ..."}
            onNewRequest={this.onReassignChanged}
          />
          <div className={css(styles.loadingIndicator)}>
            {this.state.loading ? <CircularProgress size={32} /> : null}
          </div>
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
  organizationId: type.string.isRequired,
  onReassignRequested: type.func.isRequired,
  onReassignAllMatchingRequested: type.func.isRequired,
  conversationCount: type.number.isRequired
};

export default Reassign;
