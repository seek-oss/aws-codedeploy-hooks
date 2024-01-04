import 'aws-sdk-client-mock-jest';

import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { mockClient } from 'aws-sdk-client-mock';

import { storage } from '../../framework/context';

import { smokeTest } from './smokeTest';

const lambda = mockClient(LambdaClient);

afterEach(() => lambda.reset());

describe('smokeTest', () => {
  const oneFn = [{ name: 'mock-name', version: 'mock-version' }];

  const twoFns = [
    { name: 'mock-name-1', version: 'mock-version-1' },
    { name: 'mock-name-2', version: 'mock-version-2' },
  ];

  it('returns on happy path', async () => {
    lambda.on(InvokeCommand).resolves({ StatusCode: 200 });

    await expect(smokeTest(oneFn)).resolves.toBeUndefined();

    expect(lambda).toHaveReceivedCommandTimes(InvokeCommand, 1);

    const [invocation] = lambda.commandCalls(InvokeCommand);

    expect(invocation!.firstArg.input).toMatchInlineSnapshot(`
      {
        "ClientContext": "eyJjdXN0b20iOnsidXNlci1hZ2VudCI6ImF3cy1jb2RlZGVwbG95LWhvb2tzL2xvY2FsIn19",
        "FunctionName": "mock-name",
        "InvocationType": "RequestResponse",
        "Payload": "{}",
        "Qualifier": "mock-version",
      }
    `);

    const clientContext = JSON.parse(
      Buffer.from(invocation!.firstArg.input.ClientContext, 'base64').toString(
        'utf-8',
      ),
    );

    expect(clientContext).toMatchInlineSnapshot(`
      {
        "custom": {
          "user-agent": "aws-codedeploy-hooks/local",
        },
      }
    `);
  });

  it('embeds a request ID where available', async () => {
    lambda.on(InvokeCommand).resolves({ StatusCode: 200 });

    await expect(
      storage.run({ requestId: 'mock-request-id' }, () => smokeTest(oneFn)),
    ).resolves.toBeUndefined();

    const [invocation] = lambda.commandCalls(InvokeCommand);

    const clientContext = JSON.parse(
      Buffer.from(invocation!.firstArg.input.ClientContext, 'base64').toString(
        'utf-8',
      ),
    );

    expect(clientContext).toMatchInlineSnapshot(`
      {
        "custom": {
          "user-agent": "aws-codedeploy-hooks/local",
          "x-request-id": "mock-request-id",
        },
      }
    `);
  });

  it('supports multiple functions', async () => {
    lambda.on(InvokeCommand).resolves({ StatusCode: 200 });

    await expect(
      storage.run({ requestId: 'mock-request-id' }, () =>
        smokeTest([
          { name: 'mock-name-1', version: 'mock-version-1' },
          { name: 'mock-name-2', version: 'mock-version-2' },
        ]),
      ),
    ).resolves.toBeUndefined();

    expect(lambda).toHaveReceivedCommandTimes(InvokeCommand, 2);

    const invocations = lambda.commandCalls(InvokeCommand);

    expect(invocations.map((invocation) => invocation.firstArg.input))
      .toMatchInlineSnapshot(`
        [
          {
            "ClientContext": "eyJjdXN0b20iOnsidXNlci1hZ2VudCI6ImF3cy1jb2RlZGVwbG95LWhvb2tzL2xvY2FsIiwieC1yZXF1ZXN0LWlkIjoibW9jay1yZXF1ZXN0LWlkIn19",
            "FunctionName": "mock-name-1",
            "InvocationType": "RequestResponse",
            "Payload": "{}",
            "Qualifier": "mock-version-1",
          },
          {
            "ClientContext": "eyJjdXN0b20iOnsidXNlci1hZ2VudCI6ImF3cy1jb2RlZGVwbG95LWhvb2tzL2xvY2FsIiwieC1yZXF1ZXN0LWlkIjoibW9jay1yZXF1ZXN0LWlkIn19",
            "FunctionName": "mock-name-2",
            "InvocationType": "RequestResponse",
            "Payload": "{}",
            "Qualifier": "mock-version-2",
          },
        ]
      `);
  });

  it('propagates an error from the AWS API', async () => {
    const err = new Error('mock-error');

    lambda
      .on(InvokeCommand, {
        FunctionName: 'mock-name-1',
        Qualifier: 'mock-version-1',
      })
      .resolves({ StatusCode: 200 });

    lambda
      .on(InvokeCommand, {
        FunctionName: 'mock-name-2',
        Qualifier: 'mock-version-2',
      })
      .rejects(err);

    await expect(smokeTest(twoFns)).rejects.toThrow(err);
  });

  it('propagates an error from the Lambda function', async () => {
    lambda
      .on(InvokeCommand)
      .resolves({ FunctionError: 'mock-function-error', StatusCode: 200 });

    await expect(smokeTest(oneFn)).rejects.toThrowErrorMatchingInlineSnapshot(
      `"Lambda function responded with error: mock-function-error"`,
    );
  });

  it('throws on an unexpected status code from the Lambda function', async () => {
    // Indicates a `DryRun` invocation type.
    // https://docs.aws.amazon.com/lambda/latest/dg/API_Invoke.html#API_Invoke_ResponseSyntax
    lambda.on(InvokeCommand).resolves({ StatusCode: 204 });

    await expect(smokeTest(oneFn)).rejects.toThrowErrorMatchingInlineSnapshot(
      `"Lambda function responded with unexpected status code: 204"`,
    );
  });
});
