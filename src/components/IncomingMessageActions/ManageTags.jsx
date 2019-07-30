import React, { Component } from 'react'
import type from 'prop-types'
import { css, StyleSheet } from 'aphrodite'
import RaisedButton from 'material-ui/RaisedButton'
import theme from '../../styles/theme'
import TagsSelector from '../TagsSelector'

const inlineStyles = {
  button: {
    marginBottom: '10px'
  }
}

const styles = StyleSheet.create({
  container: {
    ...theme.layouts.multiColumn.container,
    alignContent: 'flex-start',
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: '10px'
  },
  flexColumn: {
    display: 'flex',
    flexDirection: 'column',
    marginRight: '10px',
    alignItems: 'flex-start'
  }
})


class ManageTags extends Component {
  constructor(props) {
    super(props)

    this.state = {
      selectedTags: [],
      tagsFilter: props.tagsFilter || { selectedTags: {} }
    }
  }

  componentWillReceiveProps = (props) => {
    if (props.tagsFilter) {
      this.setState({ tagsFilter: props.tagsFilter })
    }
  }

  handleAssignTags = () => {
    this.props.onAssignTags(this.state.selectedTags)
  }

  handleRemoveTags = () => {
    this.props.onRemoveTags(this.state.selectedTags)
  }

  handleTagsSelected = (tagsFilter) => {
    const selectedTags = Object.keys(tagsFilter.selectedTags).map(key => tagsFilter.selectedTags[key].value)
    this.setState({ selectedTags, tagsFilter })
  }

  pluralizeTags = () => (this.state.selectedTags.length !== 1 ? 'tags' : 'tag')

  render = () => {
    return (< div className={css(styles.container)} >
      <div className={css(styles.flexColumn)}>
        <TagsSelector
          hideMetafilters
          hintText='Select tags'
          onChange={this.handleTagsSelected}
          tagsFilter={this.state.tagsFilter}
        />
      </div>
      <div className={css(styles.flexColumn)}>
        <RaisedButton
          label={`Remove ${this.pluralizeTags()} from selected`}
          onClick={this.handleRemoveTags}
          disabled={!Object.keys(this.state.tagsFilter.selectedTags || {}).length > 0}
          style={inlineStyles.button}
        />
        <RaisedButton
          label={`Assign ${this.pluralizeTags()} to selected`}
          onClick={this.handleAssignTags}
          disabled={!Object.keys(this.state.tagsFilter.selectedTags || {}).length > 0}
          style={inlineStyles.button}
        />
      </div>
    </div >)
  }
}


ManageTags.propTypes = {
  onAssignTags: type.func.isRequired,
  onRemoveTags: type.func.isRequired,
  tagsFilter: type.object
}

export default ManageTags
