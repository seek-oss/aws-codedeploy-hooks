const skuba = require('eslint-config-skuba');

module.exports = [
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
