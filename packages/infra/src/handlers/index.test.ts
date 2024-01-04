jest.mock('./process/process');

import 'aws-sdk-client-mock-jest';

import {
  CodeDeployClient,
  LifecycleEventStatus,
  PutLifecycleEventHookExecutionStatusCommand,
} from '@aws-sdk/client-codedeploy';
import { mockClient } from 'aws-sdk-client-mock';

import { testLogs } from './framework/logging';
import { processEvent } from './process/process';

import { handler } from '.';

const codeDeploy = mockClient(CodeDeployClient);

const processEventMock = jest.mocked(processEvent);

afterEach(() => {
  codeDeploy.reset();
  processEventMock.mockReset();
  testLogs.length = 0;
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

  it('reports a success back to CodeDeploy', async () => {
    processEventMock.mockResolvedValue(undefined);

    codeDeploy.on(PutLifecycleEventHookExecutionStatusCommand).resolves({});

    await expect(handler(event, context)).resolves.toBeUndefined();

    expect(processEventMock).toHaveBeenCalledTimes(1);

    expect(codeDeploy).toHaveReceivedNthCommandWith(
      1,
      PutLifecycleEventHookExecutionStatusCommand,
      {
        deploymentId: event.DeploymentId,
        lifecycleEventHookExecutionId: event.LifecycleEventHookExecutionId,
        status: LifecycleEventStatus.SUCCEEDED,
      },
    );

    expect(testLogs).toStrictEqual([
      {
        awsRequestId: context.awsRequestId,
        level: 30,
        msg: 'Reported lifecycle event status',
        status: LifecycleEventStatus.SUCCEEDED,
        timestamp: expect.any(String),
      },
    ]);
  });

  it('reports a failure back to CodeDeploy', async () => {
    const err = new Error('mock-error');

    processEventMock.mockRejectedValue(err);

    codeDeploy.on(PutLifecycleEventHookExecutionStatusCommand).resolves({});

    await expect(handler(event, context)).resolves.toBeUndefined();

    expect(processEventMock).toHaveBeenCalledTimes(1);

    expect(codeDeploy).toHaveReceivedNthCommandWith(
      1,
      PutLifecycleEventHookExecutionStatusCommand,
      {
        deploymentId: event.DeploymentId,
        lifecycleEventHookExecutionId: event.LifecycleEventHookExecutionId,
        status: LifecycleEventStatus.FAILED,
      },
    );

    expect(testLogs).toStrictEqual([
      {
        awsRequestId: context.awsRequestId,
        err: expect.objectContaining({ message: err.message }),
        level: 50,
        msg: 'Failed to process lifecycle event',
        timestamp: expect.any(String),
      },
      {
        awsRequestId: context.awsRequestId,
        level: 30,
        msg: 'Reported lifecycle event status',
        status: LifecycleEventStatus.FAILED,
        timestamp: expect.any(String),
      },
    ]);
  });

  it('throws a failure to report a success', async () => {
    const err = new Error('mock-error');

    processEventMock.mockResolvedValue(undefined);

    codeDeploy.on(PutLifecycleEventHookExecutionStatusCommand).rejects(err);

    await expect(
      handler(event, context),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"Failed to report lifecycle event status"`,
    );

    expect(processEventMock).toHaveBeenCalledTimes(1);

    expect(codeDeploy).toHaveReceivedNthCommandWith(
      1,
      PutLifecycleEventHookExecutionStatusCommand,
      {
        deploymentId: event.DeploymentId,
        lifecycleEventHookExecutionId: event.LifecycleEventHookExecutionId,
        status: LifecycleEventStatus.SUCCEEDED,
      },
    );

    expect(testLogs).toStrictEqual([
      {
        awsRequestId: context.awsRequestId,
        err: expect.objectContaining({ message: err.message }),
        level: 50,
        msg: 'Failed to report lifecycle event status',
        status: LifecycleEventStatus.SUCCEEDED,
        timestamp: expect.any(String),
      },
    ]);
  });
  it('throws a failure to report a failure', async () => {
    const processError = new Error('mock-process-error');
    const reportError = new Error('mock-report-error');

    codeDeploy
      .on(PutLifecycleEventHookExecutionStatusCommand)
      .rejects(reportError);

    processEventMock.mockRejectedValue(processError);

    await expect(
      handler(event, context),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"Failed to report lifecycle event status"`,
    );

    expect(processEventMock).toHaveBeenCalledTimes(1);

    expect(codeDeploy).toHaveReceivedNthCommandWith(
      1,
      PutLifecycleEventHookExecutionStatusCommand,
      {
        deploymentId: event.DeploymentId,
        lifecycleEventHookExecutionId: event.LifecycleEventHookExecutionId,
        status: LifecycleEventStatus.FAILED,
      },
    );

    expect(testLogs).toStrictEqual([
      {
        awsRequestId: context.awsRequestId,
        err: expect.objectContaining({ message: processError.message }),
        level: 50,
        msg: 'Failed to process lifecycle event',
        timestamp: expect.any(String),
      },
      {
        awsRequestId: context.awsRequestId,
        err: expect.objectContaining({ message: reportError.message }),
        level: 50,
        msg: 'Failed to report lifecycle event status',
        status: LifecycleEventStatus.FAILED,
        timestamp: expect.any(String),
      },
    ]);
  });
});
