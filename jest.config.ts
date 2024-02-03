import { Jest } from 'skuba';

export default Jest.mergePreset({
  coveragePathIgnorePatterns: ['<rootDir>/packages/infra/cli/'],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
  setupFiles: ['<rootDir>/jest.setup.ts'],
  testPathIgnorePatterns: ['/test\\.ts'],
});
