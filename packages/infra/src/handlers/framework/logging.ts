import { createDestination, createLogger } from '@seek/logger';

import { config } from '../config.js';

import { getContext } from './context.js';

const { destination, stdoutMock } = createDestination({
  mock: config.environment === 'test' ? { redact: [], remove: [] } : false,
});

export { stdoutMock };

export const logger = createLogger(
  {
    base: null,

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
