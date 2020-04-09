import "./webpack-config";
import "./backcompat";
import React, { Suspense } from "react";
import ReactDOM from "react-dom";
import { Router, browserHistory } from "react-router";
import { syncHistoryWithStore } from "react-router-redux";
import { ApolloProvider as ApolloProviderLegacy } from "react-apollo";
import { ApolloProvider } from "@apollo/react-hooks";
import MuiThemeProvider from "material-ui/styles/MuiThemeProvider";

import muiTheme from "src/styles/mui-theme";
import makeRoutes from "./routes";
import Store from "src/store";
import ApolloClientSingleton from "src/network/apollo-client-singleton";
import LoadingIndicator from "src/components/LoadingIndicator";
import ErrorBoundary from "src/components/ErrorBoundary";
import client from "src/client/apollo";

import { login, logout } from "./auth-service";
import Telemetry from "./telemetry";

Telemetry.init();

window.AuthService = {
  login,
  logout
};

const store = new Store(browserHistory, window.INITIAL_STATE);
const history = syncHistoryWithStore(browserHistory, store.data);

ReactDOM.render(
  <MuiThemeProvider muiTheme={muiTheme}>
    <ErrorBoundary>
      <ApolloProviderLegacy store={store.data} client={ApolloClientSingleton}>
        <ApolloProvider client={client}>
          <Suspense fallback={<LoadingIndicator />}>
            <Router history={history} routes={makeRoutes()} />
          </Suspense>
        </ApolloProvider>
      </ApolloProviderLegacy>
    </ErrorBoundary>
  </MuiThemeProvider>,
  document.getElementById("mount")
);
