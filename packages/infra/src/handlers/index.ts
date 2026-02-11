import { LifecycleEventStatus } from '@aws-sdk/client-codedeploy';
import type { Context } from 'aws-lambda';

import { storage, withTimeout } from './framework/context.js';
import { logger } from './framework/logging.js';
import {
  type DeploymentInfo,
  getDeploymentInfo,
  process,
} from './process/process.js';
import { reportEventStatus } from './report.js';
import type { CodeDeployLifecycleHookEvent } from './types.js';

export const handler = (
  event: CodeDeployLifecycleHookEvent,
  context: Pick<Context, 'awsRequestId' | 'getRemainingTimeInMillis'>,
): Promise<void> =>
  storage.run(
    {
      invocation: {
        requestId: context.awsRequestId,
        deploymentId: event.DeploymentId,
      },
    },
    async () => {
      // Reserve a generous 30 seconds to report the status back to CodeDeploy.
      const timeoutMs = context.getRemainingTimeInMillis() - 30_000;

      let status: LifecycleEventStatus = LifecycleEventStatus.FAILED;
      let deploymentInfo: DeploymentInfo | undefined;

      try {
        await withTimeout(async () => {
          deploymentInfo = await getDeploymentInfo(event);
          return process(deploymentInfo);
        }, timeoutMs);

        status = LifecycleEventStatus.SUCCEEDED;
      } catch (err) {
        logger.error(
          { err, ...deploymentInfo },
          'Failed to process lifecycle event',
        );
      }

      try {
        await reportEventStatus(event, status);

        logger.info(
          { status, ...deploymentInfo },
          'Reported lifecycle event status',
        );
      } catch (err) {
        const message = 'Failed to report lifecycle event status';

        logger.error({ err, status, ...deploymentInfo }, message);

        throw new Error(message);
      }
    },
  );
