import { InvokeCommand } from '@aws-sdk/client-lambda';

import { config } from '../../config';
import { lambdaClient } from '../../framework/aws';
import { getContext } from '../../framework/context';

import type { LambdaFunction } from './types';

export const smokeTest = async (fns: LambdaFunction[]): Promise<void> => {
  await Promise.all(fns.map((fn) => smokeTestFunction(fn)));
};

export const smokeTestFunction = async ({
  name,
  version,
}: LambdaFunction): Promise<void> => {
  const { abortSignal, requestId } = getContext();

  const meta = {
    custom: {
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
    throw new Error(
      `Lambda function responded with error: ${response.FunctionError}`,
    );
  }
};
