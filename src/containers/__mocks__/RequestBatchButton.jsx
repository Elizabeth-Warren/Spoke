/*
The actual RequestBatchButton is a connected component, which makes
it not work in tests of non-connected components. So we provide this
mock for use in Jest tests.
*/

import React from "react";

export default function RequestBatchButton() {
  return <span>RequestBatchButton</span>;
}
