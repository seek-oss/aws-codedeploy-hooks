import {
  InvokeCommand,
  type InvokeCommandOutput,
} from '@aws-sdk/client-lambda';

import { config } from '../../config.js';
import { lambdaClient } from '../../framework/aws.js';
import { getContext } from '../../framework/context.js';

import type { LambdaFunction } from './types.js';

const tryParsePayload = (response: InvokeCommandOutput) => {
  let payload: unknown = response.Payload?.transformToString();

  if (typeof payload === 'string') {
    try {
      payload = JSON.parse(payload);
    } catch {}
  }

  return payload ? { payload } : undefined;
};

export const smokeTest = async (fns: LambdaFunction[]): Promise<void> => {
  await Promise.all(fns.map((fn) => smokeTestFunction(fn)));
};

export const smokeTestFunction = async ({
  name,
  version,
}: LambdaFunction): Promise<void> => {
  const { abortSignal, requestId } = getContext();

  const meta = {
    Custom: {
      'user-agent': config.userAgent,
      ...(requestId ? { 'x-request-id': requestId } : null),
    },
  };

  const clientContext = Buffer.from(JSON.stringify(meta)).toString('base64');

  const invokeCommand = new InvokeCommand({
    ClientContext: clientContext,

    FunctionName: name,

    InvocationType: 'RequestResponse',

    Payload: '{}',

    Qualifier: version,
  });

  const response = await lambdaClient.send(invokeCommand, { abortSignal });

  if (response.StatusCode !== 200) {
    throw new Error(
      `Lambda function responded with unexpected status code: ${response.StatusCode}`,
    );
  }

  if (response.FunctionError) {
    throw Object.assign(
      new Error(
        `Lambda function responded with error: ${response.FunctionError}`,
      ),
      tryParsePayload(response),
    );
  }
};
