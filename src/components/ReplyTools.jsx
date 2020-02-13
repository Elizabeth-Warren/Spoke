import React, { Component } from "react";
import type from "prop-types";
import { Tabs, Tab } from "material-ui";
import { StyleSheet, css } from "aphrodite";

import CannedResponseMenu from "./CannedResponseMenu";
import EmbeddedShifter from "./EmbeddedShifter";

const styles = StyleSheet.create({
  wrapper: {
    height: "100%"
  },
  componentWrapper: {
    height: "calc(100% - 60px)"
  }
});

export default class ReplyTools extends Component {
  static propTypes = {
    onSelectCannedResponse: type.func,
    campaignCannedResponses: type.array,
    shiftingConfiguration: type.object,
    contact: type.object
  };

  state = {
    tab: "cannedResponses"
  };

  getTabs() {
    const tabs = [
      {
        name: "cannedResponses",
        label: "Script",
        component: CannedResponseMenu
      }
    ];

    if (
      this.props.shiftingConfiguration &&
      this.props.shiftingConfiguration.enabled
    ) {
      tabs.push({
        name: "shifter",
        label: "Event Sign-Up",
        component: EmbeddedShifter
      });
    }

    return tabs;
  }

  render() {
    const tabs = this.getTabs();
    const currentTab = tabs.find(t => t.name === this.state.tab);

    return (
      <div className={css(styles.wrapper)}>
        <Tabs
          value={this.state.tab}
          onChange={newVal => {
            this.setState({ tab: newVal });
          }}
        >
          {tabs.map(tab => (
            <Tab key={tab.name} value={tab.name} label={tab.label} />
          ))}
        </Tabs>

        <div className={css(styles.componentWrapper)}>
          <currentTab.component {...this.props} />
        </div>
      </div>
    );
  }
}
