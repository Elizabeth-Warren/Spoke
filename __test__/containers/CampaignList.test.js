/**
 * @jest-environment jsdom
 */
import React from "react";
import { mount } from "enzyme";
import MuiThemeProvider from "material-ui/styles/MuiThemeProvider";
import { CampaignList } from "../../src/containers/CampaignsList";
import { StyleSheetTestUtils } from "aphrodite";

const mutations = {
  archiveCampaign: async _ => {}
};

describe("Campaign list for campaign with null creator", () => {
  // given
  const campaignWithoutCreator = {
    id: 1,
    title: "Yes on A",
    creator: null
  };

  const data = {
    organization: {
      campaigns: {
        pageInfo: { offset: 0, limit: 50, total: 1 },
        campaigns: [campaignWithoutCreator]
      }
    }
  };

  // when
  test("Renders for campaign with null creator, doesn't include created by", () => {
    StyleSheetTestUtils.suppressStyleInjection();
    const wrapper = mount(
      <MuiThemeProvider>
        <CampaignList data={data} mutations={mutations} />
      </MuiThemeProvider>
    );
    expect(wrapper.text().includes("Created by")).toBeFalsy();
  });
});

describe("Campaign list for campaign with creator", () => {
  // given
  const campaignWithCreator = {
    id: 1,
    creator: {
      displayName: "Lorem Ipsum"
    }
  };

  const data = {
    organization: {
      campaigns: {
        pageInfo: { offset: 0, limit: 50, total: 1 },
        campaigns: [campaignWithCreator]
      }
    }
  };

  // when
  test("Renders for campaign with creator, includes created by", () => {
    StyleSheetTestUtils.suppressStyleInjection();
    const wrapper = mount(
      <MuiThemeProvider>
        <CampaignList data={data} mutations={mutations} />
      </MuiThemeProvider>
    );
    expect(
      wrapper.containsMatchingElement(
        <span> &mdash; Created by Lorem Ipsum</span>
      )
    ).toBeTruthy();
  });
});
