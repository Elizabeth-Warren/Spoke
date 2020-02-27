import React, { Component } from "react";
import types from "prop-types";

import { RaisedButton } from "material-ui";
import * as Sentry from "@sentry/browser";

import Telemetry from "src/client/telemetry";

export default class ErrorBoundary extends Component {
  static propTypes = {
    children: types.node
  };

  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error(error, errorInfo);
    Telemetry.reportError(error, errorInfo, eventId => {
      this.setState({ eventId });
    });
  }

  renderError() {
    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        <div>
          <img
            src="https://ew-spoke-public.elizabethwarren.codes/sad-bailey.png"
            alt="Sad Bailey"
          />
        </div>
        <h1>Something Went Wrong</h1>
        <p style={{ margin: "25px 0" }}>
          Sorry, Spoke hit a roadbump! Please try again in a moment.
        </p>
        <RaisedButton label="Reload" onClick={() => window.location.reload()} />
        <p>or</p>
        <RaisedButton
          label="Go Home"
          onClick={() => {
            window.location.href = "/";
          }}
        />
        <div style={{ margin: "50px auto", maxWidth: "300px" }}>
          <p>
            We&apos;ve automatically reported this error and our engineers are
            on it! If you are seeing this message a lot, please help out out and
          </p>
          <RaisedButton
            label="Report Details"
            onClick={() =>
              Sentry.showReportDialog({
                eventId: this.state.eventId,
                title: "Let Us Know What Happened",
                subtitle:
                  "We've already notified our engineers about this error.",
                subtitle2: "If you'd like to help, tell us what happened below."
              })
            }
          />
        </div>
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
