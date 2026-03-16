import { type Config } from 'jest';
import { pathsToModuleNameMapper } from 'ts-jest';

const { compilerOptions } = require('../../tsconfig.base.json') as {
  compilerOptions: { paths: Record<string, string[]> };
};

const config: Config = {
  displayName: 'api-gateway',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
  },
  moduleFileExtensions: ['js', 'json', 'ts'],
  moduleNameMapper:
    pathsToModuleNameMapper(compilerOptions.paths, {
      prefix: '<rootDir>/../../',
    }) ?? {},
  coverageDirectory: '../../coverage/apps/api-gateway',
};

export default config;
