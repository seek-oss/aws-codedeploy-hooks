jest.mock('./smokeTest');
jest.mock('./prune');
jest.mock('../../framework/context');

import 'aws-sdk-client-mock-jest';

import {
  CodeDeployClient,
  GetApplicationRevisionCommand,
} from '@aws-sdk/client-codedeploy';
import { GetFunctionCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { mockClient } from 'aws-sdk-client-mock';

import {
  getContext,
  updateTargetLambdaMetadata,
} from '../../framework/context.js';

import { type Options, lambda } from './lambda.js';
import { prune } from './prune.js';
import type { LambdaAppSpec } from './schema.js';
import { smokeTest } from './smokeTest.js';

const codeDeploy = mockClient(CodeDeployClient);
const lambdaClientMock = mockClient(LambdaClient);

const smokeTestMock = jest.mocked(smokeTest);
const pruneMock = jest.mocked(prune);
const updateTargetLambdaMetadataMock = jest.mocked(updateTargetLambdaMetadata);
const getContextMock = jest.mocked(getContext);

beforeEach(() => {
  getContextMock.mockReturnValue({});
});

afterEach(() => {
  codeDeploy.reset();
  lambdaClientMock.reset();
  smokeTestMock.mockReset();
  pruneMock.mockReset();
  updateTargetLambdaMetadataMock.mockReset();
  getContextMock.mockReset();
});

describe('lambda', () => {
  const appSpec: LambdaAppSpec = {
    version: '0.0',
    Resources: [
      {
        LambdaFunction: {
          Type: 'AWS::Lambda::Function',
          Properties: {
            Name: 'mock-lambda-name',
            Alias: 'live',
            CurrentVersion: '1',
            TargetVersion: '2',
          },
        },
      },
    ],
    Hooks: [
      {
        BeforeAllowTraffic: 'aws-codedeploy-hook-LifecycleEvent',
      },
    ],
  };
  const opts: Options = {
    applicationName: 'mock-application-name',
    revision: {
      appSpecContent: {
        sha256: 'mock-sha256',
      },
    },
  };

  it('executes a smoke test on BeforeAllowTraffic', async () => {
    codeDeploy.on(GetApplicationRevisionCommand).resolves({
      revision: {
        string: {
          content: JSON.stringify(appSpec),
        },
      },
    });

    lambdaClientMock.on(GetFunctionCommand).resolves({
      Configuration: {
        FunctionName: 'mock-lambda-name',
      },
    });

    await expect(lambda(opts)).resolves.toBeUndefined();

    expect(smokeTestMock).toHaveBeenCalledTimes(1);

    expect(smokeTestMock.mock.lastCall).toMatchInlineSnapshot(`
      [
        [
          {
            "name": "mock-lambda-name",
            "version": "2",
          },
        ],
      ]
    `);
  });

  it('throws an error if AppSpec is not valid JSON', async () => {
    codeDeploy.on(GetApplicationRevisionCommand).resolves({
      revision: {
        string: {
          content: '}',
        },
      },
    });

    await expect(lambda(opts)).rejects.toThrowErrorMatchingInlineSnapshot(
      `"Application revision not in expected format: SyntaxError: Unexpected token '}', "}" is not valid JSON"`,
    );
  });

  it('throws an error if AppSpec is not inlined as a string', async () => {
    codeDeploy.on(GetApplicationRevisionCommand).resolves({
      revision: {
        gitHubLocation: {
          commitId: 'mock-commit-id',
          repository: 'mock-repository',
        },
      },
    });

    await expect(lambda(opts)).rejects.toThrowErrorMatchingInlineSnapshot(
      `"Application revision not in expected format: SyntaxError: Unexpected end of JSON input"`,
    );
  });

  it('throws an error if AppSpec is in unexpected format', async () => {
    codeDeploy.on(GetApplicationRevisionCommand).resolves({
      revision: {
        string: {
          content: JSON.stringify({ ...appSpec, version: '1.0' }),
        },
      },
    });

    await expect(lambda(opts)).rejects.toThrowErrorMatchingInlineSnapshot(`
      "Application revision not in expected format: [
        {
          "code": "invalid_value",
          "values": [
            "0.0"
          ],
          "path": [
            "version"
          ],
          "message": "Invalid input: expected \\"0.0\\""
        }
      ]"
    `);
  });

  it('throws an error if AppSpec specifies the current hook as both BeforeAllowTraffic and AfterAllowTraffic', async () => {
    codeDeploy.on(GetApplicationRevisionCommand).resolves({
      revision: {
        string: {
          content: JSON.stringify({
            ...appSpec,
            Hooks: [
              { BeforeAllowTraffic: 'aws-codedeploy-hook-LifecycleEvent' },
              { AfterAllowTraffic: 'aws-codedeploy-hook-LifecycleEvent' },
            ],
          }),
        },
      },
    });

    lambdaClientMock.on(GetFunctionCommand).resolves({
      Configuration: {
        FunctionName: 'mock-lambda-name',
      },
    });

    await expect(lambda(opts)).rejects.toThrowErrorMatchingInlineSnapshot(
      `"You cannot configure the same Lambda function for BeforeAllowTraffic and AfterAllowTraffic"`,
    );
  });

  it('executes a prune on AfterAllowTraffic', async () => {
    codeDeploy.on(GetApplicationRevisionCommand).resolves({
      revision: {
        string: {
          content: JSON.stringify({
            ...appSpec,
            Hooks: [
              { AfterAllowTraffic: 'aws-codedeploy-hook-LifecycleEvent' },
            ],
          }),
        },
      },
    });

    lambdaClientMock.on(GetFunctionCommand).resolves({
      Configuration: {
        FunctionName: 'mock-lambda-name',
      },
    });

    await expect(lambda(opts)).resolves.toBeUndefined();

    expect(pruneMock).toHaveBeenCalledTimes(1);
  });

  it('throws an error if AppSpec does not specify the current hook', async () => {
    codeDeploy.on(GetApplicationRevisionCommand).resolves({
      revision: {
        string: {
          content: JSON.stringify({
            ...appSpec,
            Hooks: [{ BeforeAllowTraffic: 'another-hook' }],
          }),
        },
      },
    });

    lambdaClientMock.on(GetFunctionCommand).resolves({
      Configuration: {
        FunctionName: 'mock-lambda-name',
      },
    });

    await expect(lambda(opts)).rejects.toThrowErrorMatchingInlineSnapshot(
      `"Application spec does not specify the current function as a hook"`,
    );
  });
});
