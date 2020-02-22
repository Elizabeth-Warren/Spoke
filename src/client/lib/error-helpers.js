import _ from "lodash";

export function getGraphQLErrors(response) {
  return _.get(response, "errors.graphQLErrors", []);
}

/**
 * Checks for a given error code and returns the _first_ error with that code
 * in the response's graphql errors array.
 */
export function checkForErrorCode(response, code) {
  return _.find(getGraphQLErrors(response), err => err.code === code);
}
