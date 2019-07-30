import { css, StyleSheet } from 'aphrodite'
import _ from 'lodash'
import { Card, CardHeader, CardText } from 'material-ui/Card'
import Toggle from 'material-ui/Toggle'
import type from 'prop-types'
import React, { Component } from 'react'
import theme from '../../styles/theme'
import SelectedCampaigns from '../SelectedCampaigns'
import CampaignFilter, { ALL_CAMPAIGNS } from './Filters/CampaignsFilter'
import MessageStatusFilter, { MESSAGE_STATUSES } from './Filters/MessageStatusFilter'
import TexterFilter from './Filters/TexterFilter'
import TagsFilter from './Filters/TagsFilter'

const inlineStyles = {
  containerOfContainers: {
    display: 'flex',
    flexDirection: 'column',
    flexWrap: 'nowrap'
  }
}

const styles = StyleSheet.create({
  containerOfContainers: inlineStyles.containerOfContainers,
  container: {
    ...theme.layouts.multiColumn.container,
    alignContent: 'flex-start',
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
    alignItems: 'center'
  },
  flexColumn: {
    width: '30%'
  },
  toggleFlexColumn: {
    width: '30%'
  },
  spacer: {
    marginRight: '30px'
  }
})

class IncomingMessageFilter extends Component {
  constructor(props) {
    super(props)

    this.state = {
      selectedCampaigns: [],
      messageFilter: [],
      campaignSearchText: '',
      texterSearchText: '',
      tagsFilter: {}
    }
  }
  onTagsFilterChanged = (tagsFilter) => {
    this.setState({ tagsFilter })
    this.props.onTagsFilterChanged(tagsFilter)
  }

  onMessageFilterSelectChanged = (event, index, values) => {
    this.setState({ messageFilter: values })
    const messageStatuses = new Set()
    values.forEach(value => {
      const children = MESSAGE_STATUSES[value].children
      if (children.length > 0) {
        children.forEach(child => messageStatuses.add(child))
      } else {
        messageStatuses.add(value)
      }
    })

    const messageStatusesString = Array.from(messageStatuses).join(',')
    this.props.onMessageFilterChanged(messageStatusesString)
  }

  onCampaignSelected = (selection, index) => {
    let campaignId = undefined
    if (index === -1) {
      const campaign = this.props.campaigns.find(cmpgn => cmpgn.title === selection)
      if (campaign) {
        campaignId = campaign.id
      }
    } else {
      campaignId = selection.value.key
    }
    if (campaignId) {
      const selectedCampaigns = this.makeSelectedCampaignsArray(selection.rawValue, selection.text)
      this.applySelectedCampaigns(selectedCampaigns)
    }
  }

  onTexterSelected = (selection, index) => {
    let texterUserId = undefined
    if (index === -1) {
      const texter = this.props.texters.find(texter => {
        return texter.displayName === selection
      })
      if (texter) {
        texterUserId = texter.id
      }
    } else {
      texterUserId = selection.value.key
    }
    if (texterUserId) {
      this.props.onTexterChanged(parseInt(texterUserId, 10))
    }
  }

  applySelectedCampaigns = (selectedCampaigns) => {
    this.setState(
      {
        selectedCampaigns,
        campaignSearchText: ''
      }
    )

    this.fireCampaignChanged(selectedCampaigns)
  }

  handleCampaignRemoved = (campaignId) => {
    const selectedCampaigns = this.state.selectedCampaigns.filter(campaign => campaign.key !== campaignId)
    this.applySelectedCampaigns(selectedCampaigns)
  }

  handleClearCampaigns = () => {
    this.applySelectedCampaigns([])
  }

  fireCampaignChanged = (selectedCampaigns) => {
    this.props.onCampaignChanged(this.selectedCampaignIds(selectedCampaigns))
  }

  removeAllCampaignsFromCampaignsArray = (campaign) => campaign.key !== ALL_CAMPAIGNS

  makeSelectedCampaignsArray = (campaignId, campaignText) => {
    const selectedCampaign = { key: campaignId, text: campaignText }
    if (campaignId === ALL_CAMPAIGNS) {
      return []
    }
    return _.concat(this.state.selectedCampaigns.filter(this.removeAllCampaignsFromCampaignsArray), selectedCampaign)
  }

  selectedCampaignIds = (selectedCampaigns) => selectedCampaigns.map(campaign => parseInt(campaign.key, 10))

  campaignsNotAlreadySelected = (campaign) => {
    return !this.selectedCampaignIds(this.state.selectedCampaigns).includes(parseInt(campaign.id, 10))
  }

  render() {
    return (
      <Card>
        <CardHeader title='Message Filter' actAsExpander showExpandableButton />
        <CardText
          style={inlineStyles.containerOfContainers}
          expandable
        >
          <div className={css(styles.container)}>
            <div className={css(styles.toggleFlexColumn)}>
              <Toggle
                label={'Active Campaigns'}
                onToggle={this.props.onActiveCampaignsToggled}
                toggled={
                  this.props.includeActiveCampaigns ||
                  !this.props.includeArchivedCampaigns
                }
              />
              <br />
              <Toggle
                label={'Archived Campaigns'}
                onToggle={this.props.onArchivedCampaignsToggled}
                toggled={this.props.includeArchivedCampaigns}
              />
            </div>
            <div className={css(styles.spacer)} />
            <div className={css(styles.toggleFlexColumn)}>
              <Toggle
                label={'Not Opted Out'}
                onToggle={this.props.onNotOptedOutConversationsToggled}
                toggled={
                  this.props.includeNotOptedOutConversations ||
                  !this.props.includeOptedOutConversations
                }
              />
              <br />
              <Toggle
                label={'Opted Out'}
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
              <CampaignFilter
                campaigns={this.props.campaigns}
                campaignsNotAlreadySelected={this.campaignsNotAlreadySelected}
                onFocus={() => this.setState({ campaignSearchText: '' })}
                onSearchTextUpdated={
                  campaignSearchText =>
                    this.setState({ campaignSearchText })
                }
                campaignSearchText={this.state.campaignSearchText}
                onCampaignSelected={this.onCampaignSelected}
              />
            </div>
            <div className={css(styles.spacer)} />
            <div className={css(styles.flexColumn)}>
              <TexterFilter
                texters={this.props.texters}
                onFocus={() => this.setState({ texterSearchText: '' })}
                onSearchTextUpdated={
                  texterSearchText =>
                    this.setState({ texterSearchText })
                }
                texterSearchText={this.state.texterSearchText}
                onTexterSelected={this.onTexterSelected}
              />
            </div>
          </div>

          <div className={css(styles.container)}>
            <TagsFilter
              onChange={this.onTagsFilterChanged}
            />
          </div>


          <div className={css(styles.container)}>
            <SelectedCampaigns
              campaigns={this.state.selectedCampaigns}
              onDeleteRequested={this.handleCampaignRemoved}
              onClear={this.handleClearCampaigns}
            />
          </div>
        </CardText>
      </Card >
    )
  }
}

IncomingMessageFilter.propTypes = {
  onCampaignChanged: type.func.isRequired,
  onTexterChanged: type.func.isRequired,
  onActiveCampaignsToggled: type.func.isRequired,
  onArchivedCampaignsToggled: type.func.isRequired,
  includeArchivedCampaigns: type.bool.isRequired,
  includeActiveCampaigns: type.bool.isRequired,
  onNotOptedOutConversationsToggled: type.func.isRequired,
  onOptedOutConversationsToggled: type.func.isRequired,
  includeNotOptedOutConversations: type.bool.isRequired,
  includeOptedOutConversations: type.bool.isRequired,
  campaigns: type.array.isRequired,
  texters: type.array.isRequired,
  onMessageFilterChanged: type.func.isRequired,
  onTagsFilterChanged: type.func.isRequired,
  assignmentsFilter: type.shape({
    texterId: type.number
  }).isRequired
}

export default IncomingMessageFilter
