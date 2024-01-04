jest.mock('./smokeTest');

import 'aws-sdk-client-mock-jest';

import {
  CodeDeployClient,
  GetApplicationRevisionCommand,
} from '@aws-sdk/client-codedeploy';
import { mockClient } from 'aws-sdk-client-mock';

import { type Options, lambda } from './lambda';
import type { LambdaAppSpec } from './schema';
import { smokeTest } from './smokeTest';

const codeDeploy = mockClient(CodeDeployClient);

const smokeTestMock = jest.mocked(smokeTest);

afterEach(() => {
  codeDeploy.reset();
  smokeTestMock.mockReset();
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
          "received": "1.0",
          "code": "invalid_literal",
          "expected": "0.0",
          "path": [
            "version"
          ],
          "message": "Invalid literal value, expected \\"0.0\\""
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

    await expect(lambda(opts)).rejects.toThrowErrorMatchingInlineSnapshot(
      `"You cannot configure the same Lambda function for BeforeAllowTraffic and AfterAllowTraffic"`,
    );
  });

  it('throws an error if AppSpec specifies the current hook as AfterAllowTraffic', async () => {
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

    await expect(lambda(opts)).rejects.toThrowErrorMatchingInlineSnapshot(
      `"AfterAllowTraffic is not yet supported"`,
    );
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

    await expect(lambda(opts)).rejects.toThrowErrorMatchingInlineSnapshot(
      `"Application spec does not specify the current function as a hook"`,
    );
  });
});
