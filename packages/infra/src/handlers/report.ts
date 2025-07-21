import {
  type LifecycleEventStatus,
  PutLifecycleEventHookExecutionStatusCommand,
} from '@aws-sdk/client-codedeploy';

import { codeDeployClient } from './framework/aws.js';
import { getAbortSignal } from './framework/context.js';
import type { CodeDeployLifecycleHookEvent } from './types.js';

export const reportEventStatus = async (
  event: CodeDeployLifecycleHookEvent,
  status: LifecycleEventStatus,
): Promise<void> => {
  await codeDeployClient.send(
    new PutLifecycleEventHookExecutionStatusCommand({
      deploymentId: event.DeploymentId,
      lifecycleEventHookExecutionId: event.LifecycleEventHookExecutionId,
      status,
    }),
    { abortSignal: getAbortSignal() },
  );
};
