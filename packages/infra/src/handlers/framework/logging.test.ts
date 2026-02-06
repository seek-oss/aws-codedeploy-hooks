import { storage } from './context.js';
import { logger, stdoutMock } from './logging.js';

describe('logger', () => {
  beforeEach(() => {
    stdoutMock.clear();
  });

  it.each(['local', 'production', 'test'])(
    'initialises in %s environment',
    (environment) => {
      process.env.ENVIRONMENT = environment;

      return jest.isolateModulesAsync(async () => {
        await expect(import('./logging.js')).resolves.toMatchObject({
          logger: expect.any(Object),
        });
      });
    },
  );

  it('mixin overrides the service tag with targetLambdaService from context', () => {
    storage.run(
      {
        requestId: 'test-request-id',
        deploymentId: 'test-deployment-id',
        targetLambdaService: 'target-service-name',
      },
      () => {
        logger.info('test message');
      },
    );

    expect(stdoutMock.calls).toHaveLength(1);
    expect(stdoutMock.calls[0]).toMatchObject({
      service: 'target-service-name',
      awsRequestId: 'test-request-id',
      deploymentId: 'test-deployment-id',
      msg: 'test message',
    });
  });

  it('uses default service when targetLambdaService is not set in context', () => {
    logger.info('test message without override');

    expect(stdoutMock.calls).toHaveLength(1);
    expect(stdoutMock.calls[0]).toMatchObject({
      service: 'aws-codedeploy-hooks',
      msg: 'test message without override',
    });
  });
});
