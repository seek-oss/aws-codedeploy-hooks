import { LifecycleEventStatus } from '@aws-sdk/client-codedeploy';
import type { Context } from 'aws-lambda';

import { reportEventStatus } from './report';
import type { CodeDeployLifecycleHookEvent } from './types';

export const handler = async (
  event: CodeDeployLifecycleHookEvent,
  _context: Pick<Context, 'awsRequestId' | 'getRemainingTimeInMillis'>,
): Promise<void> => {
  await reportEventStatus(event, LifecycleEventStatus.SUCCEEDED);

  return;
};
