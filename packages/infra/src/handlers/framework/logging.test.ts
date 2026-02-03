import type { GetFunctionCommandOutput } from '@aws-sdk/client-lambda';

import { storage } from './context.js';

describe('getLogger', () => {
  it.each(['local', 'production', 'test'])(
    'initialises in %s environment',
    (environment) => {
      process.env.ENVIRONMENT = environment;

      return jest.isolateModulesAsync(async () => {
        await expect(import('./logging.js')).resolves.toMatchObject({
          getLogger: expect.any(Function),
        });
      });
    },
  );

  describe('service name resolution', () => {
    it('uses Tags.service when available (new convention)', async () => {
      const { getLogger } = await import('./logging.js');

      const metadata: GetFunctionCommandOutput = {
        $metadata: {},
        Tags: {
          service: 'my-service-from-tags',
        },
        Configuration: {
          FunctionName: 'fallback-function-name',
          Environment: {
            Variables: {
              DD_SERVICE: 'fallback-dd-service',
            },
          },
        },
      };

      const logger = storage.run(
        { requestId: 'test-request', deploymentId: 'test-deployment' },
        () => getLogger(metadata),
      );

      expect(logger.bindings()).toMatchObject({
        service: 'my-service-from-tags',
      });
    });

    it('falls back to DD_SERVICE environment variable', async () => {
      const { getLogger } = await import('./logging.js');

      const metadata: GetFunctionCommandOutput = {
        $metadata: {},
        Tags: {},
        Configuration: {
          FunctionName: 'fallback-function-name',
          Environment: {
            Variables: {
              DD_SERVICE: 'my-service-from-dd',
            },
          },
        },
      };

      const logger = storage.run(
        { requestId: 'test-request', deploymentId: 'test-deployment' },
        () => getLogger(metadata),
      );

      expect(logger.bindings()).toMatchObject({
        service: 'my-service-from-dd',
      });
    });

    it('falls back to FunctionName when tags and DD_SERVICE are missing', async () => {
      const { getLogger } = await import('./logging.js');

      const metadata: GetFunctionCommandOutput = {
        $metadata: {},
        Tags: {},
        Configuration: {
          FunctionName: 'my-function-name',
          Environment: {
            Variables: {},
          },
        },
      };

      const logger = storage.run(
        { requestId: 'test-request', deploymentId: 'test-deployment' },
        () => getLogger(metadata),
      );

      expect(logger.bindings()).toMatchObject({
        service: 'my-function-name',
      });
    });

    it('uses "aws-codedeploy-hooks" when all service sources are missing', async () => {
      const { getLogger } = await import('./logging.js');

      const metadata: GetFunctionCommandOutput = {
        $metadata: {},
        Tags: undefined,
        Configuration: {
          Environment: undefined,
        },
      };

      const logger = storage.run(
        { requestId: 'test-request', deploymentId: 'test-deployment' },
        () => getLogger(metadata),
      );

      expect(logger.bindings()).toMatchObject({
        service: 'aws-codedeploy-hooks',
      });
    });

    it('includes request context in mixin', async () => {
      const { getLogger } = await import('./logging.js');

      const metadata: GetFunctionCommandOutput = {
        $metadata: {},
        Tags: {
          service: 'test-service',
        },
        Configuration: {},
      };

      const logger = storage.run(
        {
          requestId: 'my-request-id',
          deploymentId: 'my-deployment-id',
        },
        () => getLogger(metadata),
      );

      const bindings = logger.bindings();
      expect(bindings).toMatchObject({
        service: 'test-service',
      });

      storage.run(
        {
          requestId: 'new-request-id',
          deploymentId: 'new-deployment-id',
        },
        () => {
          const childLogger = logger.child({});
          expect(childLogger.bindings()).toMatchObject({
            service: 'test-service',
          });
        },
      );
    });

    it('configures pino-pretty transport for local environment', async () => {
      process.env.ENVIRONMENT = 'local';
      process.env.AWS_LAMBDA_FUNCTION_NAME = 'test-function';
      process.env.AWS_LAMBDA_FUNCTION_VERSION = '1';
      process.env.AWS_REGION = 'us-east-1';

      return jest.isolateModulesAsync(async () => {
        const { getLogger } = await import('./logging.js');

        const metadata: GetFunctionCommandOutput = {
          $metadata: {},
          Tags: {
            service: 'test-service',
          },
          Configuration: {},
        };

        const logger = storage.run(
          { requestId: 'test-request', deploymentId: 'test-deployment' },
          () => getLogger(metadata),
        );

        expect(logger.bindings()).toMatchObject({
          service: 'test-service',
          env: 'local',
        });
      });
    });
  });
});
