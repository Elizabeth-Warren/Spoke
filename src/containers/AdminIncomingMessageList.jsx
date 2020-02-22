import PropTypes from "prop-types";
import React, { Component } from "react";
import _ from "lodash";
import RaisedButton from "material-ui/RaisedButton";

import IncomingMessageActions from "../components/IncomingMessageActions";
import IncomingMessageFilter from "../components/IncomingMessageFilter";
import IncomingMessageList from "../components/IncomingMessageList";
import gql from "graphql-tag";
import loadData from "./hoc/load-data";
import { withRouter } from "react-router";
import wrapMutations from "./hoc/wrap-mutations";
import { IGNORE_TAGS_FILTER } from "../lib/tags";

const CONVERSATION_LIST_ROW_SIZES = (typeof window !== "undefined" &&
  window.CONVERSATION_LIST_ROW_SIZES &&
  JSON.parse(window.CONVERSATION_LIST_ROW_SIZES)) || [10, 30, 50, 100];
const INITIAL_PAGE_SIZE = CONVERSATION_LIST_ROW_SIZES[0];

function getContactsFilterForConversationOptOutStatus(
  includeNotOptedOutConversations,
  includeOptedOutConversations
) {
  let isOptedOut = undefined;
  if (!includeNotOptedOutConversations && includeOptedOutConversations) {
    isOptedOut = true;
  } else if (
    (includeNotOptedOutConversations && !includeOptedOutConversations) ||
    (!includeNotOptedOutConversations && !includeOptedOutConversations)
  ) {
    isOptedOut = false;
  }

  return { isOptedOut };
}

export class AdminIncomingMessageList extends Component {
  static tagsFilterStateFromTagsFilter = tagsFilter => {
    let newTagsFilter = null;
    if (tagsFilter.anyTag) {
      newTagsFilter = ["*"];
    } else if (tagsFilter.noTag) {
      newTagsFilter = [];
    } else if (!tagsFilter.ignoreTags) {
      newTagsFilter = Object.values(tagsFilter.selectedTags).map(
        tagFilter => tagFilter.value
      );
    }

    return newTagsFilter;
  };

  constructor(props) {
    super(props);

    this.state = {
      page: 0,
      pageSize: INITIAL_PAGE_SIZE,
      contactsFilter: {
        isOptedOut: false,
        includeResolvedTags: true,
        tags: AdminIncomingMessageList.tagsFilterStateFromTagsFilter(
          IGNORE_TAGS_FILTER
        )
      },
      assignmentsFilter: {},
      needsRender: false,
      utc: Date.now().toString(),
      campaigns: [],
      includeArchivedCampaigns: false,
      conversationCount: 0,
      includeActiveCampaigns: true,
      includeNotOptedOutConversations: true,
      includeOptedOutConversations: false,
      clearSelectedMessages: false
    };
  }

  shouldComponentUpdate = (dummy, nextState) => {
    if (
      !nextState.needsRender &&
      _.isEqual(this.state.contactsFilter, nextState.contactsFilter) &&
      _.isEqual(this.state.assignmentsFilter, nextState.assignmentsFilter)
    ) {
      return false;
    }
    return true;
  };

  componentDidUpdate = () => {
    if (this.state.clearSelectedMessages) {
      this.setState({
        clearSelectedMessages: false,
        needsRender: true
      });
    }
  };

  getSelectedCampaignContactIds = () =>
    this.state.campaignIdsContactIds.map(contact => contact.campaignContactId);

  campaignsFilter = () => ({
    campaignId: this.props.params.campaignId
  });

  handleTexterChanged = async texterId => {
    const assignmentsFilter = {};
    if (texterId >= 0) {
      assignmentsFilter.texterId = texterId;
    }
    await this.setState({
      clearSelectedMessages: true,
      assignmentsFilter,
      page: 0,
      needsRender: true
    });
  };

  handleMessageFilterChange = async messagesFilter => {
    const contactsFilter = {
      ...this.state.contactsFilter,
      messageStatus: messagesFilter
    };
    await this.setState({
      clearSelectedMessages: true,
      contactsFilter,
      page: 0,
      needsRender: true
    });
  };

  handleTagsFilterChanged = tagsFilter => {
    const newTagsFilter = AdminIncomingMessageList.tagsFilterStateFromTagsFilter(
      tagsFilter
    );

    const contactsFilter = {
      ...this.state.contactsFilter,
      tags: newTagsFilter || undefined
    };

    this.setState({
      clearSelectedMessages: true,
      contactsFilter,
      tagsFilter,
      page: 0,
      needsRender: true
    });
  };

  handleReassignRequested = async newTexterUserId => {
    await this.props.mutations.reassignCampaignContacts(
      this.props.params.organizationId,
      this.state.campaignIdsContactIds,
      newTexterUserId
    );
    this.setState({
      utc: Date.now().toString(),
      clearSelectedMessages: true,
      needsRender: true
    });
  };

  handleReassignAllMatchingRequested = async newTexterUserId => {
    await this.props.mutations.bulkReassignCampaignContacts(
      this.props.params.organizationId,
      this.campaignsFilter(),
      this.state.assignmentsFilter || {},
      this.state.contactsFilter || {},
      newTexterUserId
    );
    this.setState({
      utc: Date.now().toString(),
      clearSelectedMessages: true,
      needsRender: true
    });
  };

  handlePageChange = async page => {
    await this.setState({
      page,
      needsRender: true
    });
  };

  handlePageSizeChange = async pageSize => {
    await this.setState({ needsRender: true, pageSize, page: 0 });
  };

  handleRowSelection = async data => {
    console.log(`*** SELECTED CONVERSATIONS *** ${data.length}`);
    await this.setState({
      campaignIdsContactIds: data,
      needsRender: false
    });
  };

  handleCampaignTextersReceived = async campaignTexters => {
    this.setState({
      campaignTexters,
      reassignmentTexters: campaignTexters,
      needsRender: true
    });
  };

  handleNotOptedOutConversationsToggled = async () => {
    if (
      this.state.includeNotOptedOutConversations &&
      !this.state.includeOptedOutConversations
    ) {
      return;
    }

    const contactsFilterUpdate = getContactsFilterForConversationOptOutStatus(
      !this.state.includeNotOptedOutConversations,
      this.state.includeOptedOutConversations
    );

    const contactsFilter = {
      ...this.state.contactsFilter,
      ...contactsFilterUpdate
    };

    this.setState({
      clearSelectedMessages: true,
      contactsFilter,
      page: 0,
      includeNotOptedOutConversations: !this.state
        .includeNotOptedOutConversations
    });
  };

  handleOptedOutConversationsToggled = async () => {
    const includeNotOptedOutConversations =
      this.state.includeNotOptedOutConversations ||
      !this.state.includeOptedOutConversations;

    const contactsFilterUpdate = getContactsFilterForConversationOptOutStatus(
      includeNotOptedOutConversations,
      !this.state.includeOptedOutConversations
    );

    const contactsFilter = {
      ...this.state.contactsFilter,
      ...contactsFilterUpdate
    };

    this.setState({
      clearSelectedMessages: true,
      contactsFilter,
      page: 0,
      includeNotOptedOutConversations,
      includeOptedOutConversations: !this.state.includeOptedOutConversations
    });
  };

  handleAssignTags = async tags => {
    const campaignContactIds = this.getSelectedCampaignContactIds();
    await this.props.mutations.addTags(campaignContactIds, tags, "");
    this.setState({
      utc: Date.now().toString(),
      needsRender: true,
      clearSelectedMessages: true
    });
  };

  handleRemoveTags = async tags => {
    const campaignContactIds = this.getSelectedCampaignContactIds();
    await this.props.mutations.resolveTags(campaignContactIds, tags);
    this.setState({
      utc: Date.now().toString(),
      needsRender: true,
      clearSelectedMessages: true
    });
  };

  handleForceRefresh = (clearSelectedMessages = false) => {
    this.setState({
      utc: Date.now().toString(),
      needsRender: true,
      clearSelectedMessages
    });
  };

  conversationCountChanged = conversationCount => {
    this.setState({
      conversationCount
    });
  };

  render() {
    const cursor = {
      offset: this.state.page * this.state.pageSize,
      limit: this.state.pageSize
    };

    const { campaign } = this.props.campaign;

    return (
      <div>
        <div>
          <h3> Message Review - {campaign.title} </h3>
          <RaisedButton
            onTouchTap={() =>
              this.props.router.push(
                `/admin/${this.props.params.organizationId}/campaigns/${this.props.params.campaignId}`
              )
            }
            label="Back To Campaign"
          />
        </div>
        <div>
          <IncomingMessageFilter
            texters={campaign.texters}
            onTexterChanged={this.handleTexterChanged}
            onMessageFilterChanged={this.handleMessageFilterChange}
            onTagsFilterChanged={this.handleTagsFilterChanged}
            assignmentsFilter={this.state.assignmentsFilter}
            onNotOptedOutConversationsToggled={
              this.handleNotOptedOutConversationsToggled
            }
            onOptedOutConversationsToggled={
              this.handleOptedOutConversationsToggled
            }
            includeNotOptedOutConversations={
              this.state.includeNotOptedOutConversations
            }
            includeOptedOutConversations={
              this.state.includeOptedOutConversations
            }
            defaultTagsFilter={IGNORE_TAGS_FILTER}
          />
          <br />
          <IncomingMessageActions
            people={campaign.texters}
            onReassignRequested={this.handleReassignRequested}
            onReassignAllMatchingRequested={
              this.handleReassignAllMatchingRequested
            }
            conversationCount={this.state.conversationCount}
            tagsFilter={this.state.tagsFilter}
            onAssignTags={this.handleAssignTags}
            onRemoveTags={this.handleRemoveTags}
          />
          <br />
          <IncomingMessageList
            organizationId={this.props.params.organizationId}
            cursor={cursor}
            contactsFilter={this.state.contactsFilter}
            campaignsFilter={this.campaignsFilter()}
            assignmentsFilter={this.state.assignmentsFilter}
            utc={this.state.utc}
            onPageChanged={this.handlePageChange}
            onPageSizeChanged={this.handlePageSizeChange}
            onConversationSelected={this.handleRowSelection}
            onConversationCountChanged={this.conversationCountChanged}
            clearSelectedMessages={this.state.clearSelectedMessages}
            rowSizeList={CONVERSATION_LIST_ROW_SIZES.slice(0).sort(
              (a, b) => a - b
            )}
            onForceRefresh={this.handleForceRefresh}
            toolbarTop
            toolbarBottom
          />
        </div>
      </div>
    );
  }
}

const mapQueriesToProps = ({ ownProps }) => ({
  campaign: {
    query: gql`
      query getCampaign($campaignId: String!) {
        campaign(id: $campaignId) {
          id
          dueBy
          title
          id
          texters {
            id
            displayName
            email
          }
        }
      }
    `,
    variables: {
      campaignId: ownProps.params.campaignId
    },
    fetchPolicy: "network-only"
  }
});

const mapMutationsToProps = () => ({
  reassignCampaignContacts: (
    organizationId,
    campaignIdsContactIds,
    newTexterUserId
  ) => ({
    mutation: gql`
      mutation reassignCampaignContacts(
        $organizationId: String!
        $campaignIdsContactIds: [CampaignIdContactId]!
        $newTexterUserId: String!
      ) {
        reassignCampaignContacts(
          organizationId: $organizationId
          campaignIdsContactIds: $campaignIdsContactIds
          newTexterUserId: $newTexterUserId
        ) {
          campaignId
          assignmentId
        }
      }
    `,
    variables: { organizationId, campaignIdsContactIds, newTexterUserId }
  }),
  bulkReassignCampaignContacts: (
    organizationId,
    campaignsFilter,
    assignmentsFilter,
    contactsFilter,
    newTexterUserId
  ) => ({
    mutation: gql`
      mutation bulkReassignCampaignContacts(
        $organizationId: String!
        $contactsFilter: ContactsFilter
        $campaignsFilter: CampaignsFilter
        $assignmentsFilter: AssignmentsFilter
        $newTexterUserId: String!
      ) {
        bulkReassignCampaignContacts(
          organizationId: $organizationId
          contactsFilter: $contactsFilter
          campaignsFilter: $campaignsFilter
          assignmentsFilter: $assignmentsFilter
          newTexterUserId: $newTexterUserId
        ) {
          campaignId
          assignmentId
        }
      }
    `,
    variables: {
      organizationId,
      campaignsFilter,
      assignmentsFilter,
      contactsFilter,
      newTexterUserId
    }
  }),
  addTags: (campaignContactIds, tags, comment) => ({
    mutation: gql`
      mutation addTags(
        $campaignContactIds: [String]!
        $tags: [String]!
        $comment: String
      ) {
        addTagsToCampaignContacts(
          campaignContactIds: $campaignContactIds
          tags: $tags
          comment: $comment
        )
      }
    `,
    variables: {
      campaignContactIds,
      tags,
      comment
    }
  }),
  resolveTags: (campaignContactIds, tags) => ({
    mutation: gql`
      mutation addTags($campaignContactIds: [String]!, $tags: [String]!) {
        resolveTags(campaignContactIds: $campaignContactIds, tags: $tags)
      }
    `,
    variables: {
      campaignContactIds,
      tags
    }
  })
});

AdminIncomingMessageList.propTypes = {
  mutations: PropTypes.object,
  params: PropTypes.object,
  campaign: PropTypes.object,
  router: PropTypes.object
};

export default loadData(withRouter(wrapMutations(AdminIncomingMessageList)), {
  mapQueriesToProps,
  mapMutationsToProps
});
