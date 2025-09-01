jest.mock('./process/process');

import 'aws-sdk-client-mock-jest';

import {
  CodeDeployClient,
  LifecycleEventStatus,
  PutLifecycleEventHookExecutionStatusCommand,
} from '@aws-sdk/client-codedeploy';
import { mockClient } from 'aws-sdk-client-mock';

import { stdoutMock } from './framework/logging.js';
import { getDeploymentInfo, process } from './process/process.js';

import { handler } from './index.js';

const codeDeploy = mockClient(CodeDeployClient);

const getDeploymentInfoMock = jest.mocked(getDeploymentInfo);
const processMock = jest.mocked(process);

beforeEach(() => {
  getDeploymentInfoMock.mockResolvedValue({
    applicationName: 'beep',
    revision: { string: { content: 'stuff' } },
  });
});

afterEach(() => {
  codeDeploy.reset();
  getDeploymentInfoMock.mockReset();
  processMock.mockReset();
  stdoutMock.clear();
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
    processMock.mockResolvedValue(undefined);

    codeDeploy.on(PutLifecycleEventHookExecutionStatusCommand).resolves({});

    await expect(handler(event, context)).resolves.toBeUndefined();

    expect(processMock).toHaveBeenCalledTimes(1);

    expect(codeDeploy).toHaveReceivedNthCommandWith(
      1,
      PutLifecycleEventHookExecutionStatusCommand,
      {
        deploymentId: event.DeploymentId,
        lifecycleEventHookExecutionId: event.LifecycleEventHookExecutionId,
        status: LifecycleEventStatus.SUCCEEDED,
      },
    );

    expect(stdoutMock.calls).toStrictEqual([
      {
        applicationName: 'beep',
        awsRequestId: context.awsRequestId,
        ddsource: 'nodejs',
        deploymentId: 'mock-deployment-id',
        level: 30,
        msg: 'Reported lifecycle event status',
        revision: {
          string: { content: 'stuff' },
        },
        status: LifecycleEventStatus.SUCCEEDED,
        timestamp: expect.any(String),
      },
    ]);
  });

  it('reports a failure back to CodeDeploy', async () => {
    const err = Object.assign(
      new Error('Lambda function responded with error: Unhandled'),
      {
        payload: {
          errorMessage:
            'RequestId: 00000000-0000-0000-0000-000000000000 Error: Task timed out after 1.00 seconds',
          errorType: 'Sandbox.Timedout',
        },
      },
    );

    processMock.mockRejectedValue(err);

    codeDeploy.on(PutLifecycleEventHookExecutionStatusCommand).resolves({});

    await expect(handler(event, context)).resolves.toBeUndefined();

    expect(processMock).toHaveBeenCalledTimes(1);

    expect(codeDeploy).toHaveReceivedNthCommandWith(
      1,
      PutLifecycleEventHookExecutionStatusCommand,
      {
        deploymentId: event.DeploymentId,
        lifecycleEventHookExecutionId: event.LifecycleEventHookExecutionId,
        status: LifecycleEventStatus.FAILED,
      },
    );

    expect(stdoutMock.calls).toStrictEqual([
      {
        applicationName: 'beep',
        awsRequestId: context.awsRequestId,
        ddsource: 'nodejs',
        deploymentId: 'mock-deployment-id',
        err: {
          message: err.message,
          payload: err.payload,
          stack: expect.any(String),
          type: 'Error',
        },
        level: 50,
        msg: 'Failed to process lifecycle event',
        revision: {
          string: { content: 'stuff' },
        },
        timestamp: expect.any(String),
      },
      {
        applicationName: 'beep',
        awsRequestId: context.awsRequestId,
        ddsource: 'nodejs',
        deploymentId: 'mock-deployment-id',
        level: 30,
        msg: 'Reported lifecycle event status',
        revision: {
          string: { content: 'stuff' },
        },
        status: LifecycleEventStatus.FAILED,
        timestamp: expect.any(String),
      },
    ]);
  });

  it('throws on failure to report a success', async () => {
    const err = new Error('mock-error');

    processMock.mockResolvedValue(undefined);

    codeDeploy.on(PutLifecycleEventHookExecutionStatusCommand).rejects(err);

    await expect(
      handler(event, context),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"Failed to report lifecycle event status"`,
    );

    expect(processMock).toHaveBeenCalledTimes(1);

    expect(codeDeploy).toHaveReceivedNthCommandWith(
      1,
      PutLifecycleEventHookExecutionStatusCommand,
      {
        deploymentId: event.DeploymentId,
        lifecycleEventHookExecutionId: event.LifecycleEventHookExecutionId,
        status: LifecycleEventStatus.SUCCEEDED,
      },
    );

    expect(stdoutMock.calls).toStrictEqual([
      {
        applicationName: 'beep',
        awsRequestId: context.awsRequestId,
        ddsource: 'nodejs',
        deploymentId: 'mock-deployment-id',
        err: expect.objectContaining({ message: err.message }),
        level: 50,
        msg: 'Failed to report lifecycle event status',
        status: LifecycleEventStatus.SUCCEEDED,
        revision: {
          string: { content: 'stuff' },
        },
        timestamp: expect.any(String),
      },
    ]);
  });

  it('throws on failure to report a failure', async () => {
    const processError = new Error('mock-process-error');
    const reportError = new Error('mock-report-error');

    codeDeploy
      .on(PutLifecycleEventHookExecutionStatusCommand)
      .rejects(reportError);

    processMock.mockRejectedValue(processError);

    await expect(
      handler(event, context),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"Failed to report lifecycle event status"`,
    );

    expect(processMock).toHaveBeenCalledTimes(1);

    expect(codeDeploy).toHaveReceivedNthCommandWith(
      1,
      PutLifecycleEventHookExecutionStatusCommand,
      {
        deploymentId: event.DeploymentId,
        lifecycleEventHookExecutionId: event.LifecycleEventHookExecutionId,
        status: LifecycleEventStatus.FAILED,
      },
    );

    expect(stdoutMock.calls).toStrictEqual([
      {
        applicationName: 'beep',
        awsRequestId: context.awsRequestId,
        ddsource: 'nodejs',
        deploymentId: 'mock-deployment-id',
        err: expect.objectContaining({ message: processError.message }),
        level: 50,
        msg: 'Failed to process lifecycle event',
        revision: {
          string: { content: 'stuff' },
        },
        timestamp: expect.any(String),
      },
      {
        applicationName: 'beep',
        awsRequestId: context.awsRequestId,
        ddsource: 'nodejs',
        deploymentId: 'mock-deployment-id',
        err: expect.objectContaining({ message: reportError.message }),
        level: 50,
        msg: 'Failed to report lifecycle event status',
        revision: {
          string: { content: 'stuff' },
        },
        status: LifecycleEventStatus.FAILED,
        timestamp: expect.any(String),
      },
    ]);
  });
});
