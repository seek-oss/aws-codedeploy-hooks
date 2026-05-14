import skuba from 'eslint-config-skuba';

export default [
  {
    ignores: ['packages/**/lib*/', 'packages/infra/src/assets/'],
  },
  ...skuba,
  {
    files: ['**/*.{ts,cts,mts,tsx}'],

    rules: {
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
    },
  },
  {
    files: ['packages/infra/cli/**'],

    rules: {
      'no-console': 'off',
    },
  },
];
