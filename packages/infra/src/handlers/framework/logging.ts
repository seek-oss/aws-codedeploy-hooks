import { createDestination, createLogger } from '@seek/logger';

import { config } from '../config.js';

import { getContext } from './context.js';

const { destination, stdoutMock } = createDestination({
  mock: config.environment === 'test' ? { redact: [], remove: [] } : false,
});

export { stdoutMock };

export const logger = createLogger(
  {
    eeeoh: { datadog: 'tin' },
    base: {
      service: 'aws-codedeploy-hooks',
      env: config.environment,
      version: config.userAgent,
      logger: {
        name: process.env.AWS_LAMBDA_FUNCTION_NAME,
        version: process.env.VERSION,
      },
    },

    mixin: () => {
      const context = getContext();

      return {
        awsRequestId: context.requestId,
        deploymentId: context.deploymentId,

        ...(context.targetLambdaService
          ? { service: context.targetLambdaService }
          : {}),
      };
    },

    transport:
      config.environment === 'local' ? { target: 'pino-pretty' } : undefined,
  },
  destination,
);
