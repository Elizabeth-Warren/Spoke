import React from 'react'
import type from 'prop-types'
import { dataSourceItem } from '../../utils'
import AutoComplete from 'material-ui/AutoComplete'


export const ALL_CAMPAIGNS = -1

export const CAMPAIGN_TYPE_FILTERS = [[ALL_CAMPAIGNS, 'All Campaigns']]

export const CampaignsFilter = (props) => {
  const campaignNodes = CAMPAIGN_TYPE_FILTERS.map(campaignTypeFilter =>
    dataSourceItem(campaignTypeFilter[1], campaignTypeFilter[0])
  ).concat(
    !props.campaigns
      ? []
      : props.campaigns.filter(props.campaignsNotAlreadySelected).map(campaign => {
        const campaignId = parseInt(campaign.id, 10)
        const campaignDisplay = `${campaignId}: ${campaign.title}`
        return dataSourceItem(campaignDisplay, campaignId)
      })
  )
  campaignNodes.sort((left, right) => {
    return left.text.localeCompare(right.text, 'en', { sensitivity: 'base' })
  })

  return (<AutoComplete
    filter={AutoComplete.caseInsensitiveFilter}
    maxSearchResults={8}
    onFocus={props.onFocus}
    onUpdateInput={props.onSearchTextUpdated}
    searchText={props.campaignSearchText}
    dataSource={campaignNodes}
    hintText={'Search for a campaign'}
    floatingLabelText={'Select a campaign'}
    onNewRequest={props.onCampaignSelected}
  />
    )
}

CampaignsFilter.propTypes = {
  campaigns: type.array.isRequired,
  campaignsNotAlreadySelected: type.func.isRequired,
  onFocus: type.func.isRequired,
  onSearchTextUpdated: type.func.isRequired,
  campaignSearchText: type.string.isRequired,
  onCampaignSelected: type.func.isRequired
}

export default CampaignsFilter
