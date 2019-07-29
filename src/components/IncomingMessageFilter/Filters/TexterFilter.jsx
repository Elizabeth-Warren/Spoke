import React from 'react'
import type from 'prop-types'
import { dataSourceItem } from '../../utils'
import AutoComplete from 'material-ui/AutoComplete'

export const ALL_TEXTERS = -1

export const TEXTER_FILTERS = [[ALL_TEXTERS, 'All Texters']]

export const TexterFilter = (props) => {
  const texterNodes = TEXTER_FILTERS.map(texterFilter =>
    dataSourceItem(texterFilter[1], texterFilter[0])
  ).concat(
    !props.texters
      ? []
      : props.texters.map(user => {
        const userId = parseInt(user.id, 10)
        return dataSourceItem(user.displayName, userId)
      })
  )

  texterNodes.sort((left, right) => left.text.localeCompare(right.text, 'en', { sensitivity: 'base' }))

  return (<AutoComplete
    filter={AutoComplete.caseInsensitiveFilter}
    maxSearchResults={8}
    onFocus={props.onFocus}
    onUpdateInput={props.onSearchTextUpdated}
    searchText={props.texterSearchText}
    dataSource={texterNodes}
    hintText={'Search for a texter'}
    floatingLabelText={'Texter'}
    onNewRequest={props.onTexterSelected}
  />
    )
}

TexterFilter.propTypes = {
  texters: type.array.isRequired,
  onFocus: type.func.isRequired,
  onSearchTextUpdated: type.func.isRequired,
  texterSearchText: type.string.isRequired,
  onTexterSelected: type.func.isRequired
}

export default TexterFilter
