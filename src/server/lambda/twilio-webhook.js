import log from "src/server/log";

exports.handler = async (event, context) => {
  log.info({ msg: "SQS event", event, context });
};
