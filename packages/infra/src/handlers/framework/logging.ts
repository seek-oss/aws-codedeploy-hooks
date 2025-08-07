import createLogger from '@seek/logger';

import { config } from '../config.js';

import { getContext } from './context.js';

export const testLogs: unknown[] = [];

const testDestination = {
  write: (data: string) => testLogs.push(JSON.parse(data)),
};

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

  config.environment === 'test' ? testDestination : undefined,
);
