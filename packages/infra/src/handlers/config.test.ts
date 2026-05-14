import { afterEach, describe, expect, it, vi } from 'vitest';

describe('config', () => {
  afterEach(() => {
    vi.resetModules();
  });
  it.each(['local', 'production', 'test'])(
    'initialises in %s environment',
    async (environment) => {
      process.env.ENVIRONMENT = environment;

      await expect(import('./config.js')).resolves.toMatchObject({
        config: { environment },
      });
    },
  );

  it('defaults to production environment', async () => {
    delete process.env.ENVIRONMENT;

    await expect(import('./config.js')).resolves.toMatchObject({
      config: { environment: 'production' },
    });
  });

  it('throws an error if all environment variables are not set', async () => {
    process.env = {};

    await expect(
      import('./config.js'),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Error: The following environment variables are not set: AWS_DEFAULT_REGION, AWS_LAMBDA_FUNCTION_NAME, AWS_REGION, AWS_LAMBDA_FUNCTION_VERSION]`,
    );
  });

  it('throws an error if some environment variables are not set', async () => {
    process.env = {
      AWS_LAMBDA_FUNCTION_NAME: 'aws-codedeploy-hook-BeforeAllowTraffic',
      AWS_LAMBDA_FUNCTION_VERSION: 'local',
    };

    await expect(
      import('./config.js'),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Error: The following environment variables are not set: AWS_DEFAULT_REGION, AWS_REGION]`,
    );
  });
});
