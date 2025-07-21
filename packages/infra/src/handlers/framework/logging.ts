import createLogger from '@seek/logger';

import { config } from '../config.js';

import { getRequestId } from './context.js';

export const testLogs: unknown[] = [];

const testDestination = {
  write: (data: string) => testLogs.push(JSON.parse(data)),
};

export const logger = createLogger(
  {
    base: null,

    mixin: () => ({ awsRequestId: getRequestId() }),

    transport:
      config.environment === 'local' ? { target: 'pino-pretty' } : undefined,
  },

  config.environment === 'test' ? testDestination : undefined,
);
