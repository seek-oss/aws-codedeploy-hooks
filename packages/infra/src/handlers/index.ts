import { LifecycleEventStatus } from '@aws-sdk/client-codedeploy';
import type { Context } from 'aws-lambda';

import { storage, withTimeout } from './framework/context';
import { logger } from './framework/logging';
import { processEvent } from './process/process';
import { reportEventStatus } from './report';
import type { CodeDeployLifecycleHookEvent } from './types';

export const handler = (
  event: CodeDeployLifecycleHookEvent,
  context: Pick<Context, 'awsRequestId' | 'getRemainingTimeInMillis'>,
): Promise<void> =>
  storage.run({ requestId: context.awsRequestId }, async () => {
    // Reserve a generous 30 seconds to report the status back to CodeDeploy.
    const timeoutMs = context.getRemainingTimeInMillis() - 30_000;

    let status: LifecycleEventStatus = LifecycleEventStatus.FAILED;
    try {
      await withTimeout(() => processEvent(event), timeoutMs);

      status = LifecycleEventStatus.SUCCEEDED;
    } catch (err) {
      logger.error({ err }, 'Failed to process lifecycle event');
    }

    try {
      await reportEventStatus(event, status);

      logger.info({ status }, 'Reported lifecycle event status');
    } catch (err) {
      const message = 'Failed to report lifecycle event status';

      logger.error({ err, status }, message);

      throw new Error(message);
    }
  });
