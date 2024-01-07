import 'aws-sdk-client-mock-jest';

import {
  CloudFormationClient,
  DescribeStacksCommand,
  type DescribeStacksOutput,
} from '@aws-sdk/client-cloudformation';
import {
  GetFunctionConfigurationCommand,
  LambdaClient,
} from '@aws-sdk/client-lambda';
import { mockClient } from 'aws-sdk-client-mock';
import { HttpResponse, delay, http } from 'msw';
import { setupServer } from 'msw/node';

import * as context from '../../framework/context';
import { storage } from '../../framework/context';

import {
  DEFAULT_TIMEOUT_MS,
  type Options,
  gantrySmokeTest,
} from './gantrySmokeTest';

const SMOKE_TEST_URL_OUTPUT = {
  OutputKey: 'SmokeTestUrl',
  OutputValue: 'https://ext.example.com/smoke',
};

const DESCRIBE_STACKS_OUTPUT: DescribeStacksOutput = {
  Stacks: [
    {
      CreationTime: new Date(0),
      Outputs: [
        SMOKE_TEST_URL_OUTPUT,
        {
          OutputKey: 'SmokeTestUseExternalDns',
          OutputValue: 'true',
        },
      ],
      StackName: 'gantry-svc-bar-env-foo',
      StackStatus: 'CREATE_COMPLETE',
    },
  ],
};

const cloudFormationClient = mockClient(CloudFormationClient);

const lambdaClient = mockClient(LambdaClient);

const withTimeout = jest.spyOn(context, 'withTimeout');

afterEach(() => {
  cloudFormationClient.reset();
  lambdaClient.reset();
  withTimeout.mockClear();
});

describe('gantrySmokeTest', () => {
  const albSmokeTest = jest.fn<Promise<Response>, [{ request: Request }]>();
  const extSmokeTest = jest.fn<Promise<Response>, [{ request: Request }]>();

  const serialiseRequest = (
    mock: typeof albSmokeTest | typeof extSmokeTest,
  ) => {
    const request = mock.mock.lastCall![0].request;

    return {
      headers: Object.fromEntries(
        request.headers as unknown as Iterable<[unknown, unknown]>,
      ),
      url: request.url,
    };
  };

  const server = setupServer(
    http.get('https://alb.example.com/smoke', albSmokeTest),
    http.get('https://ext.example.com/smoke', extSmokeTest),
  );

  beforeAll(() => server.listen());

  afterEach(() => server.resetHandlers());

  afterAll(() => server.close());

  const opts: Options = {
    applicationName: 'gantry-environment-env-foo',
    deploymentGroupName: 'svc-bar',
  };

  it('returns on happy path', async () => {
    cloudFormationClient
      .on(DescribeStacksCommand)
      .resolves(DESCRIBE_STACKS_OUTPUT);

    extSmokeTest.mockResolvedValue(HttpResponse.text(null, { status: 200 }));

    await expect(gantrySmokeTest(opts)).resolves.toBeUndefined();

    expect(cloudFormationClient).toHaveReceivedCommandTimes(
      DescribeStacksCommand,
      1,
    );

    const [description] = cloudFormationClient.commandCalls(
      DescribeStacksCommand,
    );

    expect(description!.firstArg.input).toMatchInlineSnapshot(`
      {
        "StackName": "gantry-svc-bar-env-foo",
      }
    `);

    expect(withTimeout).toHaveBeenCalledWith(
      expect.any(Function),
      DEFAULT_TIMEOUT_MS,
    );

    expect(extSmokeTest).toHaveBeenCalledTimes(1);

    expect(serialiseRequest(extSmokeTest)).toMatchInlineSnapshot(`
      {
        "headers": {
          "host": "ext.example.com",
          "user-agent": "aws-codedeploy-hooks/local",
        },
        "url": "https://ext.example.com/smoke",
      }
    `);
  });

  it('embeds a request ID where available', async () => {
    cloudFormationClient
      .on(DescribeStacksCommand)
      .resolves(DESCRIBE_STACKS_OUTPUT);

    extSmokeTest.mockResolvedValue(HttpResponse.text(null, { status: 200 }));

    await expect(
      storage.run({ requestId: 'mock-request-id' }, () =>
        gantrySmokeTest(opts),
      ),
    ).resolves.toBeUndefined();

    expect(serialiseRequest(extSmokeTest)).toMatchInlineSnapshot(`
      {
        "headers": {
          "host": "ext.example.com",
          "user-agent": "aws-codedeploy-hooks/local",
          "x-request-id": "mock-request-id",
        },
        "url": "https://ext.example.com/smoke",
      }
    `);
  });

  it('supports ALB DNS', async () => {
    const output = structuredClone(DESCRIBE_STACKS_OUTPUT);
    output.Stacks![0]!.Outputs = [
      SMOKE_TEST_URL_OUTPUT,
      {
        OutputKey: 'SmokeTestUseExternalDns',
        OutputValue: 'false',
      },
    ];

    cloudFormationClient.on(DescribeStacksCommand).resolves(output);

    lambdaClient.on(GetFunctionConfigurationCommand).resolves({
      Environment: {
        Variables: {
          LoadBalancerDNSName: 'alb.example.com',
        },
      },
    });

    albSmokeTest.mockResolvedValue(HttpResponse.text(null, { status: 200 }));

    await expect(gantrySmokeTest(opts)).resolves.toBeUndefined();

    expect(
      lambdaClient.commandCalls(GetFunctionConfigurationCommand)[0]!.firstArg
        .input,
    ).toMatchInlineSnapshot(`
      {
        "FunctionName": "gantry-codedeploy-hook-BeforeAllowTraffic-env-foo",
      }
    `);

    expect(albSmokeTest).toHaveBeenCalledTimes(1);

    expect(serialiseRequest(albSmokeTest)).toMatchInlineSnapshot(`
      {
        "headers": {
          "host": "ext.example.com",
          "user-agent": "aws-codedeploy-hooks/local",
        },
        "url": "https://alb.example.com/smoke",
      }
    `);
  });

  it('supports a custom timeout', async () => {
    const timeoutS = 1;

    const output = structuredClone(DESCRIBE_STACKS_OUTPUT);
    output.Stacks![0]!.Outputs!.push({
      OutputKey: 'SmokeTestTimeout',
      OutputValue: String(timeoutS),
    });

    cloudFormationClient.on(DescribeStacksCommand).resolves(output);

    await expect(gantrySmokeTest(opts)).resolves.toBeUndefined();

    expect(withTimeout).toHaveBeenCalledWith(
      expect.any(Function),
      timeoutS * 1_000,
    );
  });

  it('propagates an error from the CloudFormation API', async () => {
    const err = new Error('mock-error');

    cloudFormationClient.on(DescribeStacksCommand).rejects(err);

    await expect(gantrySmokeTest(opts)).rejects.toThrow(err);
  });

  it('propagates an error from the Lambda API', async () => {
    const err = new Error('mock-error');

    const output = structuredClone(DESCRIBE_STACKS_OUTPUT);
    output.Stacks![0]!.Outputs = [
      SMOKE_TEST_URL_OUTPUT,
      {
        OutputKey: 'SmokeTestUseExternalDns',
        OutputValue: 'false',
      },
    ];

    cloudFormationClient.on(DescribeStacksCommand).resolves(output);

    lambdaClient.on(GetFunctionConfigurationCommand).rejects(err);

    await expect(gantrySmokeTest(opts)).rejects.toThrow(err);
  });

  it('throws on missing CloudFormation stack', async () => {
    // Indicates a `DryRun` invocation type.
    // https://docs.aws.amazon.com/lambda/latest/dg/API_Invoke.html#API_Invoke_ResponseSyntax
    cloudFormationClient.on(DescribeStacksCommand).resolves({ Stacks: [] });

    await expect(
      gantrySmokeTest(opts),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"Stack missing for Gantry service: gantry-svc-bar-env-foo"`,
    );
  });

  it.each(['SmokeTestUrl', 'SmokeTestUseExternalDns'])(
    'throws on missing %s output',
    async (outputKey) => {
      const output = structuredClone(DESCRIBE_STACKS_OUTPUT);
      output.Stacks![0]!.Outputs = output.Stacks![0]!.Outputs!.filter(
        ({ OutputKey }) => OutputKey !== outputKey,
      );

      cloudFormationClient.on(DescribeStacksCommand).resolves(output);

      await expect(gantrySmokeTest(opts)).rejects.toThrow(
        `${outputKey} output missing from Gantry service stack: gantry-svc-bar-env-foo`,
      );
    },
  );

  it('throws on error response from smoke test endpoint', async () => {
    cloudFormationClient
      .on(DescribeStacksCommand)
      .resolves(DESCRIBE_STACKS_OUTPUT);

    extSmokeTest.mockResolvedValue(HttpResponse.error());

    await expect(
      gantrySmokeTest(opts),
    ).rejects.toThrowErrorMatchingInlineSnapshot(`"Failed to fetch"`);
  });

  it('throws on missing LoadBalancerDNSName environment variable', async () => {
    const output = structuredClone(DESCRIBE_STACKS_OUTPUT);
    output.Stacks![0]!.Outputs = [
      SMOKE_TEST_URL_OUTPUT,
      {
        OutputKey: 'SmokeTestUseExternalDns',
        OutputValue: 'false',
      },
    ];

    cloudFormationClient.on(DescribeStacksCommand).resolves(output);

    lambdaClient.on(GetFunctionConfigurationCommand).resolves({
      Environment: {
        Variables: {},
      },
    });

    await expect(
      gantrySmokeTest(opts),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"LoadBalancerDNSName environment variable missing in Gantry hook function: gantry-codedeploy-hook-BeforeAllowTraffic-env-foo"`,
    );
  });

  it('throws on redirection from smoke test endpoint', async () => {
    cloudFormationClient
      .on(DescribeStacksCommand)
      .resolves(DESCRIBE_STACKS_OUTPUT);

    extSmokeTest.mockResolvedValue(
      HttpResponse.redirect('https://another.example.com/smoke', 301),
    );

    await expect(
      gantrySmokeTest(opts),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"Smoke test endpoint responded with error status: 301"`,
    );
  });

  it('throws on timeout', async () => {
    const timeoutS = 0.1;

    const output = structuredClone(DESCRIBE_STACKS_OUTPUT);
    output.Stacks![0]!.Outputs!.push({
      OutputKey: 'SmokeTestTimeout',
      OutputValue: String(timeoutS),
    });

    cloudFormationClient.on(DescribeStacksCommand).resolves(output);

    extSmokeTest.mockImplementation(async () => {
      await delay(timeoutS * 1000 + 1);

      if (context.getAbortSignal()!.aborted) {
        return HttpResponse.text('Client aborted', { status: 499 });
      }

      return HttpResponse.text(null, { status: 200 });
    });

    await expect(
      storage.run({ abortSignal: AbortSignal.timeout(100) }, () =>
        gantrySmokeTest(opts),
      ),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"Smoke test endpoint responded with error status: 499"`,
    );

    expect(withTimeout).toHaveBeenCalledWith(
      expect.any(Function),
      timeoutS * 1_000,
    );
  }, 15_000);

  it('propagates parent signal abortion', async () => {
    const timeoutS = 3;

    const output = structuredClone(DESCRIBE_STACKS_OUTPUT);
    output.Stacks![0]!.Outputs!.push({
      OutputKey: 'SmokeTestTimeout',
      OutputValue: String(timeoutS),
    });

    cloudFormationClient.on(DescribeStacksCommand).resolves(output);

    extSmokeTest.mockImplementation(async () => {
      await delay(100 + 1);

      if (context.getAbortSignal()!.aborted) {
        return HttpResponse.text('Client aborted', { status: 499 });
      }

      return HttpResponse.text(null, { status: 200 });
    });

    await expect(
      storage.run({ abortSignal: AbortSignal.timeout(100) }, () =>
        gantrySmokeTest(opts),
      ),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"Smoke test endpoint responded with error status: 499"`,
    );

    expect(withTimeout).toHaveBeenCalledWith(
      expect.any(Function),
      timeoutS * 1_000,
    );
  }, 15_000);
});
