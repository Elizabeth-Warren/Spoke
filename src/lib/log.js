import minilog from "minilog";
import { isClient } from "./is-client";

let logInstance;

if (isClient()) {
  minilog.enable();
  logInstance = minilog("client");
} else {
  minilog.suggest.deny(
    /.*/,
    process.env.NODE_ENV === "development" ? "debug" : "debug"
  );

  minilog
    .enable()
    .pipe(minilog.backends.console.formatWithStack)
    .pipe(minilog.backends.console);

  logInstance = minilog("backend");
  const existingErrorLogger = logInstance.error;
  logInstance.error = err => {
    existingErrorLogger(err && err.stack ? err.stack : err);
  };
}

const log = process.env.LAMBDA_DEBUG_LOG ? console : logInstance;

export { log };
