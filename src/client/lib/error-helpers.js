import _ from "lodash";

/** MODERN for new Apollo */

export function errorCodes(graphqlError) {
  if (!graphqlError.graphQLErrors) {
    return new Set();
  }

  return new Set(graphqlError.graphQLErrors.map(err => err.code));
}

/** LEGACY for old Apollo */

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
