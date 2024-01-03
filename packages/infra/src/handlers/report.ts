import {
  type LifecycleEventStatus,
  PutLifecycleEventHookExecutionStatusCommand,
} from '@aws-sdk/client-codedeploy';

import { codeDeployClient } from './framework/aws';
import { getAbortSignal } from './framework/context';
import type { CodeDeployLifecycleHookEvent } from './types';

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
