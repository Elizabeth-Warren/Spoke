import ApolloClient from "apollo-client-legacy";
import * as Sentry from "@sentry/browser";

import ResponseMiddlewareNetworkInterface from "./response-middleware-network-interface";

const responseMiddlewareNetworkInterface = new ResponseMiddlewareNetworkInterface(
  { uri: process.env.GRAPHQL_URL || "/graphql", credentials: "same-origin" }
);

responseMiddlewareNetworkInterface.use({
  applyResponseMiddleware: (response, next) => {
    const errors = response.errors || [];

    Sentry.addBreadcrumb({
      category: `log data ${
        errors.length ? "(includes errors)" : ""
      } apollo-client-singleton`,
      message: JSON.stringify(response),
      level: "info"
    });

    if (errors.find(e => e.code === "UNAUTHORIZED")) {
      window.location = `/login?nextUrl=${encodeURIComponent(
        window.location.pathname
      )}`;
      return;
    }

    if (errors.find(e => e.code === "NOT_FOUND")) {
      window.location = `/404`;
      return;
    }

    if (errors && errors.length) {
      console.error("GraphQL request resulted in error", response);
    }

    next();
  }
});

const networkInterface = responseMiddlewareNetworkInterface;

const ApolloClientSingleton = new ApolloClient({
  networkInterface
});

// For debugging
if (typeof window !== "undefined") {
  window.ApolloClient = ApolloClientSingleton;
}

export default ApolloClientSingleton;
