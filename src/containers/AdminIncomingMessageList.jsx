import PropTypes from 'prop-types'
import React, { Component } from 'react'
import _ from 'lodash'

import IncomingMessageActions from '../components/IncomingMessageActions'
import IncomingMessageFilter, { ALL_CAMPAIGNS } from '../components/IncomingMessageFilter'
import IncomingMessageList from '../components/IncomingMessageList'
import LoadingIndicator from '../components/LoadingIndicator'
import PaginatedCampaignsRetriever from './PaginatedCampaignsRetriever'
import gql from 'graphql-tag'
import loadData from './hoc/load-data'
import { withRouter } from 'react-router'
import wrapMutations from './hoc/wrap-mutations'
import PaginatedUsersRetriever from './PaginatedUsersRetriever'
import { ANY_TAG_FILTER } from '../lib/tags'

const CONVERSATION_LIST_ROW_SIZES = (typeof window !== 'undefined' && window.CONVERSATION_LIST_ROW_SIZES && JSON.parse(window.CONVERSATION_LIST_ROW_SIZES)) || [10, 30, 50, 100]
const INITIAL_PAGE_SIZE = CONVERSATION_LIST_ROW_SIZES[0]

function getCampaignsFilterForCampaignArchiveStatus(
  includeActiveCampaigns,
  includeArchivedCampaigns
) {
  let isArchived = undefined
  if (!includeActiveCampaigns && includeArchivedCampaigns) {
    isArchived = true
  } else if (
    (includeActiveCampaigns && !includeArchivedCampaigns) ||
    (!includeActiveCampaigns && !includeArchivedCampaigns)
  ) {
    isArchived = false
  }

  if (isArchived !== undefined) {
    return { isArchived }
  }

  return {}
}

function getContactsFilterForConversationOptOutStatus(
  includeNotOptedOutConversations,
  includeOptedOutConversations
) {
  let isOptedOut = undefined
  if (!includeNotOptedOutConversations && includeOptedOutConversations) {
    isOptedOut = true
  } else if (
    (includeNotOptedOutConversations && !includeOptedOutConversations) ||
    (!includeNotOptedOutConversations && !includeOptedOutConversations)
  ) {
    isOptedOut = false
  }

  return { isOptedOut }
}

export class AdminIncomingMessageList extends Component {
  static tagsFilterStateFromTagsFilter = (tagsFilter) => {
    let newTagsFilter = null
    if (tagsFilter.anyTag) {
      newTagsFilter = ['*']
    } else if (tagsFilter.noTag) {
      newTagsFilter = []
    } else if (!tagsFilter.ignoreTags) {
      newTagsFilter = Object.values(tagsFilter.selectedTags).map(
        (tagFilter) => tagFilter.value
      )
    }

    return newTagsFilter
  }

  constructor(props) {
    super(props)

    this.state = {
      page: 0,
      pageSize: INITIAL_PAGE_SIZE,
      campaignsFilter: { isArchived: false },
      contactsFilter: {
        isOptedOut: false,
        includeResolvedTags: true,
        tags: AdminIncomingMessageList.tagsFilterStateFromTagsFilter(ANY_TAG_FILTER)
      },
      assignmentsFilter: {},
      needsRender: false,
      utc: Date.now().toString(),
      campaigns: [],
      reassignmentTexters: [],
      campaignTexters: [],
      includeArchivedCampaigns: false,
      conversationCount: 0,
      includeActiveCampaigns: true,
      includeNotOptedOutConversations: true,
      includeOptedOutConversations: false,
      clearSelectedMessages: false
    }
  }

  shouldComponentUpdate = (dummy, nextState) => {
    if (
      !nextState.needsRender &&
      _.isEqual(this.state.contactsFilter, nextState.contactsFilter) &&
      _.isEqual(this.state.campaignsFilter, nextState.campaignsFilter) &&
      _.isEqual(this.state.assignmentsFilter, nextState.assignmentsFilter)
    ) {
      return false
    }
    return true
  }

  componentDidUpdate = () => {
    if (this.state.clearSelectedMessages) {
      this.setState(
        {
          clearSelectedMessages: false,
          needsRender: true
        })
    }
  }

  handleCampaignChanged = async (campaignIds) => {
    const campaignsFilter = getCampaignsFilterForCampaignArchiveStatus(
      this.state.includeActiveCampaigns,
      this.state.includeArchivedCampaigns
    )
    if (!campaignIds.find(campaignId => campaignId === ALL_CAMPAIGNS)) {
      campaignsFilter.campaignIds = campaignIds
    }

    await this.setState({
      clearSelectedMessages: true,
      campaignsFilter,
      needsRender: true
    })
  }

  handleTexterChanged = async (texterId) => {
    const assignmentsFilter = {}
    if (texterId >= 0) {
      assignmentsFilter.texterId = texterId
    }
    await this.setState({
      clearSelectedMessages: true,
      assignmentsFilter,
      needsRender: true
    })
  }

  handleMessageFilterChange = async (messagesFilter) => {
    const contactsFilter = {
      ...this.state.contactsFilter,
      messageStatus: messagesFilter
    }
    await this.setState({
      clearSelectedMessages: true,
      contactsFilter,
      needsRender: true
    })
  }

  handleTagsFilterChanged = (tagsFilter) => {
    const newTagsFilter = AdminIncomingMessageList.tagsFilterStateFromTagsFilter(tagsFilter)

    const contactsFilter = {
      ...this.state.contactsFilter,
      tags: newTagsFilter || undefined
    }

    this.setState({
      clearSelectedMessages: true,
      contactsFilter,
      tagsFilter,
      needsRender: true
    })
  }

  handleReassignRequested = async (newTexterUserId) => {
    await this.props.mutations.reassignCampaignContacts(
      this.props.params.organizationId,
      this.state.campaignIdsContactIds,
      newTexterUserId
    )
    this.setState({
      utc: Date.now().toString(),
      clearSelectedMessages: true,
      needsRender: true
    })
  }

  handleReassignAllMatchingRequested = async (newTexterUserId) => {
    await this.props.mutations.bulkReassignCampaignContacts(
      this.props.params.organizationId,
      this.state.campaignsFilter || {},
      this.state.assignmentsFilter || {},
      this.state.contactsFilter || {},
      newTexterUserId
    )
    this.setState({
      utc: Date.now().toString(),
      clearSelectedMessages: true,
      needsRender: true
    })
  }

  handlePageChange = async (page) => {
    await this.setState({
      page,
      needsRender: true
    })
  }

  handlePageSizeChange = async (pageSize) => {
    await this.setState({ needsRender: true, pageSize })
  }

  handleRowSelection = async (data) => {
    console.log(`*** SELECTED CONVERSATIONS *** ${data.length}`)
    await this.setState({
      campaignIdsContactIds: data,
      needsRender: false
    })
  }

  handleCampaignsReceived = async (campaigns) => {
    this.setState({ campaigns, needsRender: true })
  }

  handleCampaignTextersReceived = async (campaignTexters) => {
    this.setState({ campaignTexters, needsRender: true })
  }

  handleReassignmentTextersReceived = async (reassignmentTexters) => {
    this.setState({ reassignmentTexters, needsRender: true })
  }

  handleNotOptedOutConversationsToggled = async () => {
    if (
      this.state.includeNotOptedOutConversations &&
      !this.state.includeOptedOutConversations
    ) {
      return
    }

    const contactsFilterUpdate = getContactsFilterForConversationOptOutStatus(
      !this.state.includeNotOptedOutConversations,
      this.state.includeOptedOutConversations
    )

    const contactsFilter = {
      ...this.state.contactsFilter,
      ...contactsFilterUpdate
    }
    
    this.setState({
      clearSelectedMessages: true,
      contactsFilter,
      includeNotOptedOutConversations: !this.state
        .includeNotOptedOutConversations
    })
  }

  handleOptedOutConversationsToggled = async () => {
    const includeNotOptedOutConversations =
      this.state.includeNotOptedOutConversations ||
      !this.state.includeOptedOutConversations

    const contactsFilterUpdate = getContactsFilterForConversationOptOutStatus(
      includeNotOptedOutConversations,
      !this.state.includeOptedOutConversations
    )

    const contactsFilter = {
      ...this.state.contactsFilter,
      ...contactsFilterUpdate
    }

    this.setState({
      clearSelectedMessages: true,
      contactsFilter,
      includeNotOptedOutConversations,
      includeOptedOutConversations: !this.state.includeOptedOutConversations
    })
  }

  handleActiveCampaignsToggled = async () => {
    if (
      this.state.includeActiveCampaigns &&
      !this.state.includeArchivedCampaigns
    ) {
      return
    }

    const campaignsFilter = getCampaignsFilterForCampaignArchiveStatus(
      !this.state.includeActiveCampaigns,
      this.state.includeArchivedCampaigns
    )
    this.setState({
      clearSelectedMessages: true,
      campaignsFilter,
      includeActiveCampaigns: !this.state.includeActiveCampaigns
    })
  }

  handleArchivedCampaignsToggled = async () => {
    const includeActiveCampaigns =
      this.state.includeActiveCampaigns || !this.state.includeArchivedCampaigns

    const campaignsFilter = getCampaignsFilterForCampaignArchiveStatus(
      includeActiveCampaigns,
      !this.state.includeArchivedCampaigns
    )

    this.setState({
      clearSelectedMessages: true,
      campaignsFilter,
      includeActiveCampaigns,
      includeArchivedCampaigns: !this.state.includeArchivedCampaigns
    })
  }

  getSelectedCampaignContactIds = () => this.state.campaignIdsContactIds.map(contact => contact.campaignContactId)

  handleAssignTags = async (tags) => {
    const campaignContactIds = this.getSelectedCampaignContactIds()
    await this.props.mutations.addTags(campaignContactIds, tags, '')
    this.setState({
      utc: Date.now().toString(),
      needsRender: true,
      clearSelectedMessages: true,
    })
  }

  handleRemoveTags = async (tags) => {
    const campaignContactIds = this.getSelectedCampaignContactIds()
    await this.props.mutations.resolveTags(campaignContactIds, tags)
    this.setState({
      utc: Date.now().toString(),
      needsRender: true,
      clearSelectedMessages: true,
    })
  }

  handleForceRefresh = (clearSelectedMessages = false) => {
    this.setState({
      utc: Date.now().toString(),
      needsRender: true,
      clearSelectedMessages
    })
  }

  conversationCountChanged = (conversationCount) => {
    this.setState({
      conversationCount
    })
  }

  render() {
    const cursor = {
      offset: this.state.page * this.state.pageSize,
      limit: this.state.pageSize
    }
    return (
      <div>
        <h3> Message Review </h3>
        {this.props.organization && this.props.organization.loading ? (
          <LoadingIndicator />
        ) : (
          <div>
            <PaginatedUsersRetriever
              organizationId={this.props.params.organizationId}
              onUsersReceived={this.handleReassignmentTextersReceived}
              pageSize={1000}
            />
            <PaginatedUsersRetriever
              organizationId={this.props.params.organizationId}
              onUsersReceived={this.handleCampaignTextersReceived}
              pageSize={1000}
              campaignsFilter={this.state.campaignsFilter}
            />
            <PaginatedCampaignsRetriever
              organizationId={this.props.params.organizationId}
              campaignsFilter={_.pick(this.state.campaignsFilter, 'isArchived')}
              onCampaignsReceived={this.handleCampaignsReceived}
              pageSize={1000}
            />
            <IncomingMessageFilter
              campaigns={this.state.campaigns}
              texters={this.state.campaignTexters}
              onCampaignChanged={this.handleCampaignChanged}
              onTexterChanged={this.handleTexterChanged}
              onMessageFilterChanged={this.handleMessageFilterChange}
              onTagsFilterChanged={this.handleTagsFilterChanged}
              assignmentsFilter={this.state.assignmentsFilter}
              onActiveCampaignsToggled={this.handleActiveCampaignsToggled}
              onArchivedCampaignsToggled={this.handleArchivedCampaignsToggled}
              includeActiveCampaigns={this.state.includeActiveCampaigns}
              includeArchivedCampaigns={this.state.includeArchivedCampaigns}
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
              defaultTagsFilter={ANY_TAG_FILTER}
            />
            <br />
            <IncomingMessageActions
              people={this.state.reassignmentTexters}
              onReassignRequested={this.handleReassignRequested}
              onReassignAllMatchingRequested={this.handleReassignAllMatchingRequested}
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
              campaignsFilter={this.state.campaignsFilter}
              assignmentsFilter={this.state.assignmentsFilter}
              utc={this.state.utc}
              onPageChanged={this.handlePageChange}
              onPageSizeChanged={this.handlePageSizeChange}
              onConversationSelected={this.handleRowSelection}
              onConversationCountChanged={this.conversationCountChanged}
              clearSelectedMessages={this.state.clearSelectedMessages}
              rowSizeList={CONVERSATION_LIST_ROW_SIZES.sort((a, b) => a - b)}
              onForceRefresh={this.handleForceRefresh}
              toolbarTop
              toolbarBottom
            />
          </div>
          )}
      </div>
    )
  }
}

// TODO(lmp) don't need mapQueriesToProps
const mapQueriesToProps = ({ ownProps }) => ({
  organization: {
    query: gql`
      query Q($organizationId: String!) {
        organization(id: $organizationId) {
          id
          people {
            id
            displayName
            roles(organizationId: $organizationId)
          }
        }
      }
    `,
    variables: {
      organizationId: ownProps.params.organizationId
    },
    forceFetch: true
  }
})

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
                contactsFilter: $contactsFilter,
                campaignsFilter: $campaignsFilter,
                assignmentsFilter: $assignmentsFilter,
                newTexterUserId: $newTexterUserId
            ) {
                campaignId
                assignmentId
            }
        }
    `,
    variables: { organizationId, campaignsFilter, assignmentsFilter, contactsFilter, newTexterUserId }
  }),
  addTags: (campaignContactIds, tags, comment) => ({
    mutation: gql`
      mutation addTags($campaignContactIds: [String]!, $tags: [String]!, $comment: String) {
        addTagsToCampaignContacts(campaignContactIds: $campaignContactIds, tags: $tags, comment: $comment)
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
})

AdminIncomingMessageList.propTypes = {
  conversations: PropTypes.object,
  mutations: PropTypes.object,
  params: PropTypes.object,
  organization: PropTypes.object
}

export default loadData(withRouter(wrapMutations(AdminIncomingMessageList)), {
  mapQueriesToProps,
  mapMutationsToProps
})
