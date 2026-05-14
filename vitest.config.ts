import { Vitest } from 'skuba';
import { defineConfig } from 'vitest/config';

export default defineConfig(
  Vitest.mergePreset({
    ssr: {
      resolve: {
        conditions: ['@seek/aws-codedeploy-hooks/source'],
      },
    },
    test: {
      env: {
        ENVIRONMENT: 'test',
        AWS_LAMBDA_FUNCTION_NAME: 'aws-codedeploy-hook-LifecycleEvent',
        AWS_LAMBDA_FUNCTION_VERSION: 'local',
        AWS_REGION: 'ap-southeast-4',
      },
      coverage: {
        provider: 'istanbul',
        exclude: ['packages/infra/cli/**'],
        thresholds: {
          branches: 100,
          functions: 100,
          lines: 100,
          statements: 100,
        },
      },
      exclude: ['**/test.ts'],
    },
  }),
);
