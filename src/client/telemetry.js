import * as Sentry from "@sentry/browser";
import _ from "lodash";

let sentryDefaultTags = {};

function init() {
  if (!window.SENTRY_DSN) {
    return;
  }

  const sentryConfig = { dsn: window.SENTRY_DSN, environment: window.STAGE };

  sentryDefaultTags = {};
  if (window.GIT_COMMIT_SHORT) {
    sentryDefaultTags.gitCommit = window.GIT_COMMIT_SHORT;
  }

  if (window.GIT_TAGS) {
    const releaseTag = window.GIT_TAGS.split(",").find(tag =>
      tag.startsWith("release-")
    );
    if (releaseTag) {
      sentryConfig.release = releaseTag;
    }
  }

  Sentry.init(sentryConfig);
}

function reportError(err, details = {}, onSubmit = () => {}) {
  if (!window.SENTRY_DSN) {
    return;
  }

  Sentry.configureScope(scope => {
    if (window.USER_ID) {
      scope.setUser({ id: window.USER_ID });
    }

    _.each(sentryDefaultTags, (val, key) => {
      scope.setTag(key, val);
    });

    _.each(details, (val, key) => {
      scope.setExtra(key, val);
    });

    onSubmit(Sentry.captureException(err));
  });
}

export default { init, reportError };
