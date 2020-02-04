import pino from "pino";

const config = { base: null };

if (process.env.NODE_ENV !== "production") {
  // Note: pino-pretty is installed as a dev package
  config.prettyPrint = {
    ignore: "pid,hostname",
    colorize: true
  };
}

const log = pino(config);

export { log };
