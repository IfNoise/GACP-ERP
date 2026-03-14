import { type Config } from 'jest';

const config: Config = {
  displayName: 'cultivation-service',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
  },
  moduleFileExtensions: ['js', 'json', 'ts'],
  coverageDirectory: '../../coverage/apps/cultivation-service',
};

export default config;
