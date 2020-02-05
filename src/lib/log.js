// TODO: move this to server/
import pino from "pino";
import config from "../server/config";

const logConfig = { base: null, level: config.LOG_LEVEL };

if (process.env.NODE_ENV !== "production") {
  // Note: pino-pretty is installed as a dev package
  logConfig.prettyPrint = {
    ignore: "pid,hostname",
    colorize: true
  };
}

const log = pino(logConfig);

export { log };
