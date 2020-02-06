import React from "react";
import ReactDOM from "react-dom";
import { Router, browserHistory } from "react-router";
import { syncHistoryWithStore } from "react-router-redux";
import { StyleSheet } from "aphrodite";
import { ApolloProvider } from "react-apollo";

import makeRoutes from "src/routes";
import Store from "src/store";
import ApolloClientSingleton from "src/network/apollo-client-singleton";

import { login, logout } from "./auth-service";
import errorCatcher from "./error-catcher";

window.onerror = (msg, file, line, col, error) => {
  errorCatcher(error);
};
window.addEventListener("unhandledrejection", event => {
  errorCatcher(event.reason);
});
window.AuthService = {
  login,
  logout
};

const store = new Store(browserHistory, window.INITIAL_STATE);
const history = syncHistoryWithStore(browserHistory, store.data);

StyleSheet.rehydrate(window.RENDERED_CLASS_NAMES);

ReactDOM.render(
  <ApolloProvider store={store.data} client={ApolloClientSingleton}>
    <Router history={history} routes={makeRoutes()} />
  </ApolloProvider>,
  document.getElementById("mount")
);
