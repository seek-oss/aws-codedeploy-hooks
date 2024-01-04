import dotenv from 'dotenv';

describe('config', () => {
  it('throws an error if all environment variables are not set', () =>
    // @ts-expect-error - missing from `@types/jest`
    jest.isolateModulesAsync(async () => {
      process.env = {};

      await expect(
        import('./config'),
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        `"The following environment variables are not set: AWS_DEFAULT_REGION, AWS_LAMBDA_FUNCTION_NAME, AWS_REGION, AWS_LAMBDA_FUNCTION_VERSION"`,
      );
    }));

  it('throws an error if some environment variables are not set', () =>
    // @ts-expect-error - missing from `@types/jest`
    jest.isolateModulesAsync(async () => {
      process.env = {
        AWS_LAMBDA_FUNCTION_NAME: 'aws-codedeploy-hook-LifecycleEvent',
        AWS_LAMBDA_FUNCTION_VERSION: 'local',
      };

      await expect(
        import('./config'),
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        `"The following environment variables are not set: AWS_DEFAULT_REGION, AWS_REGION"`,
      );
    }));

  it.each(['local', 'production', 'test'])(
    'initialises in %s environment',
    (environment) =>
      // @ts-expect-error - missing from `@types/jest`
      jest.isolateModulesAsync(async () => {
        dotenv.config();
        process.env.ENVIRONMENT = environment;

        await expect(import('./config')).resolves.toMatchObject({
          config: { environment },
        });
      }),
  );
});
