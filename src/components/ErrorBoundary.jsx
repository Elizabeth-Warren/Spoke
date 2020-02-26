import React, { Component } from "react";

import MuiThemeProvider from "material-ui/styles/MuiThemeProvider";
import { RaisedButton } from "material-ui";

import muiTheme from "src/styles/mui-theme";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error(error, errorInfo);
  }

  renderError() {
    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        <div>
          <img src="https://ew-spoke-public.elizabethwarren.codes/sad-bailey.png" />
        </div>
        <h1>Something Went Wrong</h1>
        <p style={{ margin: "25px 0" }}>
          Sorry, Spoke hit a roadbump! Please try again and let us know in the
          Slack if you're seeing this message a lot.
        </p>
        <RaisedButton label="Reload" onClick={() => window.location.reload()} />
        <p>or</p>
        <RaisedButton
          label="Go Home"
          onClick={() => (window.location.href = "/")}
        />
      </div>
    );
  }

  render() {
    if (this.state.hasError) {
      return this.renderError();
    }

    return this.props.children;
  }
}
