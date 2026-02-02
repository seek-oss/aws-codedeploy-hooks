import type { GetFunctionCommandOutput } from '@aws-sdk/client-lambda';
import { createDestination, createLogger } from '@seek/logger';

import { config } from '../config.js';

import { getContext } from './context.js';

const { destination, stdoutMock } = createDestination({
  mock: config.environment === 'test' ? { redact: [], remove: [] } : false,
});

export { stdoutMock };

export const getLogger = (lambdaFunction: GetFunctionCommandOutput) =>
  createLogger(
    {
      eeeoh: { datadog: 'tin' },
      name: 'aws-codedeploy-hooks',
      base: {
        service:
          lambdaFunction.Tags?.service ??
          lambdaFunction.Configuration?.Environment?.Variables?.DD_SERVICE ??
          lambdaFunction.Configuration?.FunctionName ??
          'aws-codedeploy-hooks',
        env: config.environment,
        version: config.userAgent,
      },

      mixin: () => {
        const context = getContext();

        return {
          awsRequestId: context.requestId,
          deploymentId: context.deploymentId,
        };
      },

      transport:
        config.environment === 'local' ? { target: 'pino-pretty' } : undefined,
    },
    destination,
  );
