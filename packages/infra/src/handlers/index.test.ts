import 'aws-sdk-client-mock-jest';

import {
  CodeDeployClient,
  LifecycleEventStatus,
  PutLifecycleEventHookExecutionStatusCommand,
} from '@aws-sdk/client-codedeploy';
import { mockClient } from 'aws-sdk-client-mock';

import { handler } from '.';

const codeDeploy = mockClient(CodeDeployClient);

afterEach(() => codeDeploy.reset());

describe('handler', () => {
  type Event = Parameters<typeof handler>[0];
  type Context = Parameters<typeof handler>[1];

  const event: Event = {
    DeploymentId: 'mock-deployment-id',
    LifecycleEventHookExecutionId: 'mock-lifecycle-event-hook-execution-id',
  };

  const context: Context = {
    awsRequestId: 'mock-aws-request-id',
    getRemainingTimeInMillis: () => 300_000,
  };

  it('reports the event status back to CodeDeploy', async () => {
    codeDeploy
      .on(PutLifecycleEventHookExecutionStatusCommand, {
        deploymentId: event.DeploymentId,
        lifecycleEventHookExecutionId: event.LifecycleEventHookExecutionId,
        status: LifecycleEventStatus.SUCCEEDED,
      })
      .resolves({});

    await expect(handler(event, context)).resolves.toBeUndefined();

    expect(codeDeploy).toHaveReceivedCommandTimes(
      PutLifecycleEventHookExecutionStatusCommand,
      1,
    );
  });
});
