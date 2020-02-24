import React from "react";
import type from "prop-types";
import SelectField from "material-ui/SelectField";
import MenuItem from "material-ui/MenuItem";
import Divider from "material-ui/Divider";
import {
  TAGS,
  NO_TAG,
  ANY_TAG,
  IGNORE_TAGS,
  TAG_META_FILTERS,
  IGNORE_TAGS_FILTER,
  ANY_TAG_FILTER,
  NO_TAG_FILTER,
  EMPTY_TAG_FILTER,
  makeTagMetafilter
} from "../lib/tags";

import _ from "lodash";

export class TagsSelector extends React.Component {
  static cloneTagFilter = props => {
    if (
      !props.tagsFilter ||
      Object.keys(props.tagsFilter.selectedTags).length === 0
    ) {
      return null;
    }

    const selectedTags = Object.keys(props.tagsFilter.selectedTags).reduce(
      (accumulator, key) => {
        if (!props.hideMetafilters || key > 0) {
          accumulator[key] = TAGS[key] || TAG_META_FILTERS[key];
        }
        return accumulator;
      },
      {}
    );

    return {
      ignoreTags: !props.hideMetafilters && props.tagsFilter.ignoreTags,
      anyTag: !props.hideMetafilters && props.tagsFilter.anyTag,
      noTag: !props.hideMetafilters && props.tagsFilter.noTag,
      selectedTags
    };
  };

  constructor(props) {
    super(props);

    const tagFilter = TagsSelector.cloneTagFilter(props) || EMPTY_TAG_FILTER;

    this.state = {
      tagFilter
    };
  }

  UNSAFE_componentWillReceiveProps = props => {
    const tagFilter = TagsSelector.cloneTagFilter(props);
    if (tagFilter) {
      this.setState({ tagFilter });
    }
  };

  handleClick = itemClicked => {
    let tagFilter = this.state.tagFilter;
    switch (itemClicked.key) {
      case IGNORE_TAGS.key:
        tagFilter = IGNORE_TAGS_FILTER;
        break;
      case NO_TAG.key:
        tagFilter = NO_TAG_FILTER;
        break;
      case ANY_TAG.key:
        tagFilter = ANY_TAG_FILTER;
        break;
      default:
        if (tagFilter.ignoreTags || tagFilter.anyTag || tagFilter.noTag) {
          tagFilter = makeTagMetafilter(false, false, false, null);
        }

        if (itemClicked.key in tagFilter.selectedTags) {
          delete tagFilter.selectedTags[itemClicked.key];
        } else {
          tagFilter.selectedTags[itemClicked.key] = itemClicked;
        }
    }

    this.setState({ tagFilter });
    this.props.onChange(tagFilter);
  };

  createMenuItems = tagFilters => {
    return tagFilters.map(tagFilter => {
      const isChecked = tagFilter.key in this.state.tagFilter.selectedTags;
      return (
        <MenuItem
          key={tagFilter.key}
          value={tagFilter}
          primaryText={tagFilter.display}
          insetChildren
          checked={isChecked}
          onClick={() => this.handleClick(tagFilter)}
        />
      );
    });
  };

  render = () => (
    <SelectField
      multiple
      value={Object.values(this.state.tagFilter.selectedTags)}
      hintText={this.props.hintText}
      floatingLabelText={"Tags"}
      floatingLabelFixed
    >
      {!this.props.hideMetafilters &&
        this.createMenuItems(Object.values(TAG_META_FILTERS))}
      {!this.props.hideMetafilters && <Divider inset />}
      {this.createMenuItems(Object.values(TAGS))}
    </SelectField>
  );
}

TagsSelector.propTypes = {
  onChange: type.func.isRequired,
  hideMetafilters: type.bool,
  tagsFilter: type.object,
  hintText: type.string
};

export default TagsSelector;
