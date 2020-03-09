import React from "react";
import LoadingIndicator from "./LoadingIndicator";

export default function checkReady(...results) {
  // check for error
  if (results.find(r => r.error)) {
    return <p>There was an error</p>;
  }

  if (results.find(r => r.loading)) {
    return <LoadingIndicator />;
  }

  return null;
}
