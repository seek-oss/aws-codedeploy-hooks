const { ts } = require('eslint-config-seek/extensions');

module.exports = {
  extends: ['skuba'],

  overrides: [
    {
      files: [`*.{${ts}}`],
      rules: {
        '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      },
    },
  ],
};
