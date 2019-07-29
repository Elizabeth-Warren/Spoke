import React from 'react'
import type from 'prop-types'
import SelectField from 'material-ui/SelectField'
import MenuItem from 'material-ui/MenuItem'
import Divider from 'material-ui/Divider'
import { TAGS, NO_TAG, ANY_TAG, IGNORE_TAGS } from '../../../lib/tags'


const TAG_META_FILTERS = [
  IGNORE_TAGS,
  ANY_TAG,
  NO_TAG
]

const makeTagMetafilter = (ignoreTags, anyTag, noTag, tagItem) => {
  const filter = {
    ignoreTags,
    anyTag,
    noTag,
    selectedTags: {}
  }

  if (tagItem) {
    filter.selectedTags[tagItem.key] = tagItem
  }

  return filter
}

const IGNORE_TAGS_FILTER = makeTagMetafilter(true, false, false, IGNORE_TAGS)
const ANY_TAG_FILTER = makeTagMetafilter(false, true, false, ANY_TAG)
const NO_TAG_FILTER = makeTagMetafilter(false, false, true, NO_TAG)

export class TagsFilter extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      tagFilter: IGNORE_TAGS_FILTER
    }
  }

  handleClick = (itemClicked) => {
    let tagFilter = this.state.tagFilter
    switch (itemClicked.key) {
      case IGNORE_TAGS.key:
        tagFilter = IGNORE_TAGS_FILTER
        break
      case NO_TAG.key:
        tagFilter = NO_TAG_FILTER
        break
      case ANY_TAG.key:
        tagFilter = ANY_TAG_FILTER
        break
      default:
        if (tagFilter.ignoreTags || tagFilter.anyTag || tagFilter.noTag) {
          tagFilter = makeTagMetafilter(false, false, false, null)
        }

        if (itemClicked.key in tagFilter.selectedTags) {
          tagFilter.selectedTags.delete(itemClicked.key)
        } else {
          tagFilter.selectedTags[itemClicked.key] = itemClicked
        }
    }

    this.setState({ tagFilter })
    this.props.onChange(tagFilter)
  }

  createMenuItems = (tagFilters) => {
    return tagFilters.map(tagFilter => {
      const isChecked = tagFilter.key in this.state.tagFilter.selectedTags
      return (
        <MenuItem
          key={tagFilter.key}
          value={tagFilter}
          primaryText={tagFilter.display}
          insetChildren
          checked={isChecked}
          onClick={() => this.handleClick(tagFilter)}
        />
      )
    })
  }

  render = () =>
    <SelectField
      multiple
      value={Object.values(this.state.tagFilter.selectedTags)}
      hintText={'Filter by tags?'}
      floatingLabelText={'Tags'}
      floatingLabelFixed
    >
      {this.createMenuItems(TAG_META_FILTERS)}
      <Divider
        inset
      />
      {this.createMenuItems(TAGS)}
    </SelectField>

}


TagsFilter.propTypes = {
  onChange: type.func.isRequired
}


export default TagsFilter
