export const NO_TAG = { key: -1, value: -1, display: "NO TAG" };
export const ANY_TAG = { key: -2, value: -2, display: "ANY TAG" };
export const IGNORE_TAGS = { key: -3, value: -3, display: "IGNORE TAGS" };

export const TAGS = {
  1: { key: 1, value: "SPANISH", display: "SPANISH" },
  2: { key: 2, value: "HELP NEEDED", display: "HELP NEEDED" },
  3: { key: 3, value: "VOTER SUPPRESSION", display: "VOTER SUPPRESSION" },
  4: { key: 4, value: "911", display: "911" },
  5: { key: 5, value: "LANGUAGE BARRIER", display: "LANGUAGE BARRIER" }
};

export const TAG_META_FILTERS = {};
TAG_META_FILTERS[IGNORE_TAGS.key] = IGNORE_TAGS;
TAG_META_FILTERS[ANY_TAG.key] = ANY_TAG;
TAG_META_FILTERS[NO_TAG.key] = NO_TAG;

const makeTagMetafilter = (ignoreTags, anyTag, noTag, tagItem) => {
  const filter = {
    ignoreTags,
    anyTag,
    noTag,
    selectedTags: {}
  };

  if (tagItem) {
    filter.selectedTags[tagItem.key] = tagItem;
  }

  return filter;
};

export const IGNORE_TAGS_FILTER = makeTagMetafilter(
  true,
  false,
  false,
  IGNORE_TAGS
);
export const ANY_TAG_FILTER = makeTagMetafilter(false, true, false, ANY_TAG);
export const NO_TAG_FILTER = makeTagMetafilter(false, false, true, NO_TAG);
export const EMPTY_TAG_FILTER = makeTagMetafilter(false, false, false, null);

export default TAGS;
