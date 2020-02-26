import aws from "aws-sdk";

import log from "src/server/log";
import telemetry from "src/server/telemetry";
import { r } from "src/server/models";
import { updateBundleFileName } from "src/server/middleware/render-index";

const codedeploy = new aws.CodeDeploy({ apiVersion: "2014-10-06" });

function makeCodeDeployHandler(name, handlerFn) {
  return async function handler(event) {
    const deploymentId = event.DeploymentId;
    const lifecycleEventHookExecutionId = event.LifecycleEventHookExecutionId;

    const params = {
      deploymentId,
      lifecycleEventHookExecutionId,
      status: "Succeeded"
    };

    log.info({ msg: `Beginning ${name}...`, event });

    try {
      await handlerFn();
    } catch (e) {
      log.error({ error: e, msg: `${name} failed with exception` });
      await telemetry.reportError(e, { jobType: name });
      params.status = "Failed";
    }

    log.info(`${name} complete, notifying CodeDeploy...`);

    await codedeploy.putLifecycleEventHookExecutionStatus(params).promise();

    log.info("Done");
  };
}

/*
Our pre-flight handler runs database migrations
*/
module.exports.preflight = makeCodeDeployHandler("preflight", () =>
  r.knex.migrate.latest()
);

/*
Our post-flight handlers updates Redis with the new JS bundle filename so
we start serving the new frontend code.
*/
module.exports.postflight = makeCodeDeployHandler(
  "postflight",
  updateBundleFileName
);
