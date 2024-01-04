jest.mock('./process/process');

import 'aws-sdk-client-mock-jest';

import {
  CodeDeployClient,
  LifecycleEventStatus,
  PutLifecycleEventHookExecutionStatusCommand,
} from '@aws-sdk/client-codedeploy';
import { mockClient } from 'aws-sdk-client-mock';

import { processEvent } from './process/process';

import { handler } from '.';

const codeDeploy = mockClient(CodeDeployClient);

const processEventMock = jest.mocked(processEvent);

afterEach(() => {
  codeDeploy.reset();
  processEventMock.mockReset();
});

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

    processEventMock.mockResolvedValue(undefined);

    await expect(handler(event, context)).resolves.toBeUndefined();

    expect(processEventMock).toHaveBeenCalledTimes(1);

    expect(codeDeploy).toHaveReceivedCommandTimes(
      PutLifecycleEventHookExecutionStatusCommand,
      1,
    );
  });
});
