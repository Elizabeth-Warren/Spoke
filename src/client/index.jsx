import "./webpack-config";
import "./backcompat";
import React, { Suspense } from "react";
import ReactDOM from "react-dom";
import { Router, browserHistory } from "react-router";
import { syncHistoryWithStore } from "react-router-redux";
import { StyleSheet } from "aphrodite";
import { ApolloProvider } from "react-apollo";
import MuiThemeProvider from "material-ui/styles/MuiThemeProvider";

import makeRoutes from "./routes";
import Store from "src/store";
import ApolloClientSingleton from "src/network/apollo-client-singleton";
import LoadingIndicator from "src/components/LoadingIndicator";

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
    <Suspense
      fallback={
        <MuiThemeProvider>
          <LoadingIndicator />
        </MuiThemeProvider>
      }
    >
      <Router history={history} routes={makeRoutes()} />
    </Suspense>
  </ApolloProvider>,
  document.getElementById("mount")
);
