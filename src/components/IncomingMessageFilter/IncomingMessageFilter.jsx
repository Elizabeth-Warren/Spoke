import { css, StyleSheet } from "aphrodite";
import _ from "lodash";
import { Card, CardHeader, CardText } from "material-ui/Card";
import Toggle from "material-ui/Toggle";
import type from "prop-types";
import React, { Component } from "react";
import theme from "../../styles/theme";
import MessageStatusFilter, {
  MESSAGE_STATUSES
} from "./Filters/MessageStatusFilter";
import TexterFilter from "./Filters/TexterFilter";
import TagsSelector from "../TagsSelector";

const inlineStyles = {
  containerOfContainers: {
    display: "flex",
    flexDirection: "column",
    flexWrap: "nowrap"
  }
};

const styles = StyleSheet.create({
  containerOfContainers: inlineStyles.containerOfContainers,
  container: {
    ...theme.layouts.multiColumn.container,
    alignContent: "flex-start",
    justifyContent: "flex-start",
    flexWrap: "wrap",
    alignItems: "center"
  },
  flexColumn: {
    width: "30%"
  },
  toggleFlexColumn: {
    width: "30%"
  },
  spacer: {
    marginRight: "30px"
  }
});

class IncomingMessageFilter extends Component {
  constructor(props) {
    super(props);

    this.state = {
      messageFilter: [],
      texterSearchText: "",
      tagsFilter: props.defaultTagsFilter
    };
  }
  onTagsFilterChanged = tagsFilter => {
    this.setState({ tagsFilter });
    this.props.onTagsFilterChanged(tagsFilter);
  };

  onMessageFilterSelectChanged = (event, index, values) => {
    this.setState({ messageFilter: values });
    const messageStatuses = new Set();
    values.forEach(value => {
      const children = MESSAGE_STATUSES[value].children;
      if (children.length > 0) {
        children.forEach(child => messageStatuses.add(child));
      } else {
        messageStatuses.add(value);
      }
    });

    const messageStatusesString = Array.from(messageStatuses).join(",");
    this.props.onMessageFilterChanged(messageStatusesString);
  };

  onTexterSelected = (selection, index) => {
    let texterUserId = undefined;
    if (index === -1) {
      const texter = this.props.texters.find(texter => {
        return texter.displayName === selection;
      });
      if (texter) {
        texterUserId = texter.id;
      }
    } else {
      texterUserId = selection.value.key;
    }
    if (texterUserId) {
      this.props.onTexterChanged(parseInt(texterUserId, 10));
    }
  };

  render() {
    return (
      <Card>
        <CardHeader title="Message Filter" actAsExpander showExpandableButton />
        <CardText style={inlineStyles.containerOfContainers} expandable>
          <div className={css(styles.container)}>
            <div className={css(styles.toggleFlexColumn)}>
              <Toggle
                label={"Not Opted Out"}
                onToggle={this.props.onNotOptedOutConversationsToggled}
                toggled={
                  this.props.includeNotOptedOutConversations ||
                  !this.props.includeOptedOutConversations
                }
              />
              <br />
              <Toggle
                label={"Opted Out"}
                onToggle={this.props.onOptedOutConversationsToggled}
                toggled={this.props.includeOptedOutConversations}
              />
            </div>
          </div>

          <div className={css(styles.container)}>
            <div className={css(styles.flexColumn)}>
              <MessageStatusFilter
                messageFilter={this.state.messageFilter}
                onChange={this.onMessageFilterSelectChanged}
              />
            </div>
            <div className={css(styles.spacer)} />
            <div className={css(styles.flexColumn)}>
              <TexterFilter
                texters={this.props.texters}
                onFocus={() => this.setState({ texterSearchText: "" })}
                onSearchTextUpdated={texterSearchText =>
                  this.setState({ texterSearchText })
                }
                texterSearchText={this.state.texterSearchText}
                onTexterSelected={this.onTexterSelected}
              />
            </div>
          </div>

          <div className={css(styles.container)}>
            <TagsSelector
              onChange={this.onTagsFilterChanged}
              tagsFilter={this.state.tagsFilter}
            />
          </div>
        </CardText>
      </Card>
    );
  }
}

IncomingMessageFilter.propTypes = {
  onTexterChanged: type.func.isRequired,
  onNotOptedOutConversationsToggled: type.func.isRequired,
  onOptedOutConversationsToggled: type.func.isRequired,
  includeNotOptedOutConversations: type.bool.isRequired,
  includeOptedOutConversations: type.bool.isRequired,
  texters: type.array.isRequired,
  onMessageFilterChanged: type.func.isRequired,
  onTagsFilterChanged: type.func.isRequired,
  assignmentsFilter: type.shape({
    texterId: type.number
  }).isRequired,
  defaultTagsFilter: type.object
};

export default IncomingMessageFilter;
