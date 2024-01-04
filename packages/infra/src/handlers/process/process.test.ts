jest.mock('./lambda/lambda');

import {
  CodeDeployClient,
  type DeploymentInfo,
  GetDeploymentCommand,
} from '@aws-sdk/client-codedeploy';
import { mockClient } from 'aws-sdk-client-mock';

import { lambda } from './lambda/lambda';
import { parseDeploymentInfo, processEvent } from './process';

const deploymentInfo: DeploymentInfo = {
  applicationName: 'mock-application-name',
  computePlatform: 'Lambda',
  deploymentConfigName: 'CodeDeployDefault.LambdaAllAtOnce',
  deploymentGroupName: 'mock-deployment-group-name',
  deploymentStyle: {
    deploymentOption: 'WITH_TRAFFIC_CONTROL',
    deploymentType: 'BLUE_GREEN',
  },
  revision: {
    appSpecContent: {
      sha256: 'mock-sha256',
    },
  },
};

describe('processEvent', () => {
  const codeDeploy = mockClient(CodeDeployClient);

  const lambdaMock = jest.mocked(lambda);

  afterEach(() => {
    codeDeploy.reset();
    lambdaMock.mockReset();
  });

  type Event = Parameters<typeof processEvent>[0];

  const event: Event = {
    DeploymentId: 'mock-deployment-id',
    LifecycleEventHookExecutionId: 'mock-lifecycle-event-hook-execution-id',
  };

  it('propagates a supported Lambda deployment to the relevant handler', async () => {
    codeDeploy
      .on(GetDeploymentCommand, {
        deploymentId: event.DeploymentId,
      })
      .resolves({ deploymentInfo });

    lambdaMock.mockResolvedValue(undefined);

    await expect(processEvent(event)).resolves.toBeUndefined();

    expect(lambdaMock).toHaveBeenCalledTimes(1);

    expect(lambdaMock.mock.lastCall).toMatchInlineSnapshot(`
      [
        {
          "applicationName": "mock-application-name",
          "revision": {
            "appSpecContent": {
              "sha256": "mock-sha256",
            },
          },
        },
      ]
    `);
  });

  it('throws on an empty deployment response', async () => {
    codeDeploy.on(GetDeploymentCommand).resolves({});

    await expect(
      processEvent(event),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"The following deployment properties are missing: applicationName, computePlatform, deploymentGroupName, deploymentStyle, revision"`,
    );

    expect(lambdaMock).not.toHaveBeenCalled();
  });
});

describe('parseDeploymentInfo', () => {
  it('parses a supported deployment', () =>
    expect(parseDeploymentInfo(deploymentInfo)).toMatchInlineSnapshot(`
      {
        "applicationName": "mock-application-name",
        "revision": {
          "appSpecContent": {
            "sha256": "mock-sha256",
          },
        },
      }
    `));

  it('throws an error if required properties are missing', () =>
    expect(() =>
      parseDeploymentInfo({
        computePlatform: 'Lambda',
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `"The following deployment properties are missing: applicationName, deploymentGroupName, deploymentStyle, revision"`,
    ));

  it('throws an error if the deployment option is not supported', () =>
    expect(() =>
      parseDeploymentInfo({
        ...deploymentInfo,
        deploymentStyle: {
          ...deploymentInfo.deploymentStyle,
          deploymentOption: 'WITHOUT_TRAFFIC_CONTROL',
        },
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `"The following deployment option is not supported: WITHOUT_TRAFFIC_CONTROL"`,
    ));

  it('throws an error if the deployment type is not supported', () =>
    expect(() =>
      parseDeploymentInfo({
        ...deploymentInfo,
        deploymentStyle: {
          ...deploymentInfo.deploymentStyle,
          deploymentType: 'IN_PLACE',
        },
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `"The following deployment type is not supported: IN_PLACE"`,
    ));

  it('throws an error if the compute platform is not supported', () =>
    expect(() =>
      parseDeploymentInfo({
        ...deploymentInfo,
        computePlatform: 'Server',
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `"The following compute platform is not supported: Server"`,
    ));
});
