import type { Config } from 'jest';

const config: Config = {
  displayName: 'ui-components',
  preset: '../../jest.preset.js',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.[tj]sx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  coverageDirectory: '../../coverage/libs/ui-components',
};

export default config;
