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
      setupFiles: ['vitest.setup.ts'],
    },
  }),
);
