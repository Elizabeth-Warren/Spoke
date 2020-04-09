import { ApolloClient } from "apollo-client";
import { InMemoryCache } from "apollo-cache-inmemory";
import { ApolloLink } from "apollo-link";
import { RetryLink } from "apollo-link-retry";
import { BatchHttpLink } from "apollo-link-batch-http";
import { onError } from "apollo-link-error";
import * as Sentry from "@sentry/browser";

window.S = Sentry;

const cache = new InMemoryCache();

const retryLink = new RetryLink();
const httpLink = new BatchHttpLink({
  uri: process.env.GRAPHQL_URL || "/graphql",
  credentials: "same-origin"
});

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path, code }) => {
      console.error(`[GraphQL error] [${code}]: ${message}`, {
        locations,
        path
      });

      Sentry.addBreadcrumb({
        category: "apollo-graphql-error",
        message: `Apollo GraphQL error: ${message}`,
        data: { message, locations, path, code },
        level: "error"
      });

      if (code === "UNAUTHORIZED") {
        window.location = `/login?nextUrl=${encodeURIComponent(
          window.location.pathname
        )}`;
      }

      if (code === "NOT_FOUND") {
        window.location = `/404`;
      }
    });
  }

  if (networkError) {
    console.error(`[Network error]: ${networkError}`);

    Sentry.addBreadcrumb({
      category: "apollo-network-error",
      message: `Apollo network error: ${networkError}`,
      data: { networkError },
      level: "error"
    });
  }
});

const breadcrumbLink = new ApolloLink((operation, forward) => {
  Sentry.addBreadcrumb({
    category: "apollo-request",
    message: `Apollo request - ${operation.operationName}`,
    data: operation,
    level: "info"
  });

  return forward(operation).map(data => {
    Sentry.addBreadcrumb({
      category: "apollo-response",
      message: `Apollo response - ${operation.operationName}`,
      data,
      level: "info"
    });

    return data;
  });
});

export default new ApolloClient({
  cache,
  link: ApolloLink.from([retryLink, errorLink, breadcrumbLink, httpLink]),
  connectToDevTools: true,
  name: "spoke-client",
  version: window.GIT_COMMIT_SHORT || "unknown-commit"
});
