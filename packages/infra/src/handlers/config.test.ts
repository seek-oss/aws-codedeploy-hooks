import dotenv from 'dotenv';

describe('config', () => {
  it.each(['local', 'production', 'test'])(
    'initialises in %s environment',
    (environment) => {
      dotenv.config();
      process.env.ENVIRONMENT = environment;

      return jest.isolateModulesAsync(async () => {
        await expect(import('./config')).resolves.toMatchObject({
          config: { environment },
        });
      });
    },
  );

  it('defaults to production environment', () => {
    dotenv.config();
    delete process.env.ENVIRONMENT;

    return jest.isolateModulesAsync(async () => {
      await expect(import('./config')).resolves.toMatchObject({
        config: { environment: 'production' },
      });
    });
  });

  it('throws an error if all environment variables are not set', () => {
    process.env = {};

    return jest.isolateModulesAsync(async () => {
      await expect(
        import('./config'),
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        `"The following environment variables are not set: AWS_DEFAULT_REGION, AWS_LAMBDA_FUNCTION_NAME, AWS_REGION, AWS_LAMBDA_FUNCTION_VERSION"`,
      );
    });
  });

  it('throws an error if some environment variables are not set', () => {
    process.env = {
      AWS_LAMBDA_FUNCTION_NAME: 'aws-codedeploy-hook-BeforeAllowTraffic',
      AWS_LAMBDA_FUNCTION_VERSION: 'local',
    };

    return jest.isolateModulesAsync(async () => {
      await expect(
        import('./config'),
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        `"The following environment variables are not set: AWS_DEFAULT_REGION, AWS_REGION"`,
      );
    });
  });
});
