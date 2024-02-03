import {
  DescribeStacksCommand,
  type Stack,
} from '@aws-sdk/client-cloudformation';
import { GetFunctionConfigurationCommand } from '@aws-sdk/client-lambda';

import { config } from '../../config';
import { cloudFormationClient, lambdaClient } from '../../framework/aws';
import { getContext, withTimeout } from '../../framework/context';

export const DEFAULT_TIMEOUT_MS = 10_000;

export type Options = {
  applicationName: string;
  deploymentGroupName: string;
};

export const gantrySmokeTest = async ({
  applicationName,
  deploymentGroupName,
}: Options) => {
  const { abortSignal, requestId } = getContext();

  // gantry-environment-env-foo -> env-foo
  const environment = applicationName.replace(/^gantry-environment-/, '');

  // svc-bar
  const serviceName = deploymentGroupName;

  // gantry-svc-bar-env-foo
  const stackName = `gantry-${serviceName}-${environment}`;

  const stacks = await cloudFormationClient.send(
    new DescribeStacksCommand({ StackName: stackName }),
    { abortSignal },
  );

  const stack = stacks.Stacks?.[0];

  if (!stack) {
    throw new Error(`Stack missing for Gantry service: ${stackName}`);
  }

  const smokeTestUrl = getOutputValue(stack, 'SmokeTestUrl');

  if (!smokeTestUrl) {
    throw new Error(
      `SmokeTestUrl output missing from Gantry service stack: ${stackName}`,
    );
  }

  const url = new URL(smokeTestUrl);

  const host = url.host.replace(/:.+$/, '');

  const useExternalDns = getOutputValue(stack, 'SmokeTestUseExternalDns');

  if (!useExternalDns) {
    throw new Error(
      `SmokeTestUseExternalDns output missing from Gantry service stack: ${stackName}`,
    );
  }

  if (useExternalDns !== 'true') {
    const functionName = `gantry-codedeploy-hook-BeforeAllowTraffic-${environment}`;

    const lambdaConfiguration = await lambdaClient.send(
      new GetFunctionConfigurationCommand({ FunctionName: functionName }),
      { abortSignal },
    );

    const loadBalancerHost =
      lambdaConfiguration.Environment?.Variables?.LoadBalancerDNSName;

    if (!loadBalancerHost) {
      throw new Error(
        `LoadBalancerDNSName environment variable missing in Gantry hook function: ${functionName}`,
      );
    }

    // Reference the ALB hostname in the URL but send the configured hostname in
    // the Host header. This allows the smoke test to hit the service prior to
    // DNS being configured.
    url.host = loadBalancerHost;
  }

  const timeoutString = getOutputValue(stack, 'SmokeTestTimeout');

  const timeoutMs = timeoutString
    ? Number(timeoutString) * 1000
    : DEFAULT_TIMEOUT_MS;

  const controller = new AbortController();

  const { signal } = controller;

  const headers = {
    Host: host,
    'User-Agent': config.userAgent,
    ...(requestId ? { 'X-Request-Id': requestId } : null),
  };

  // The default Gantry hook allows time for the ALB listener to be updated to
  // point to the new task group.
  //
  // TODO: Is this still necessary, and if so, can we instead eagerly send the
  // request and inspect a piece of correlating version information in the
  // `Server` or `X-Api-Version` response header?
  //
  // https://github.com/seek-oss/koala/tree/master/src/versionMiddleware#readme
  // await setTimeout(10_000);

  // TODO: implement retries?
  const response = await withTimeout(
    () =>
      fetch(url, {
        headers,
        method: 'GET',
        redirect: 'error',
        signal,
      }),
    timeoutMs,
  );

  if (!response.ok) {
    throw new Error(
      `Smoke test endpoint responded with error status: ${response.status}`,
    );
  }
};

const getOutputValue = (stack: Stack, key: string): string | undefined =>
  stack.Outputs?.find((output) => output.OutputKey === key)?.OutputValue;
