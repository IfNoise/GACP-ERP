import { pathsToModuleNameMapper } from 'ts-jest';

const { compilerOptions } = require('../../tsconfig.base.json') as {
  compilerOptions: { paths: Record<string, string[]> };
};

export default {
  displayName: 'web-portal',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]sx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleNameMapper:
    pathsToModuleNameMapper(compilerOptions.paths, {
      prefix: '<rootDir>/../../',
    }) ?? {},
  coverageDirectory: '../../coverage/apps/web-portal',
};
