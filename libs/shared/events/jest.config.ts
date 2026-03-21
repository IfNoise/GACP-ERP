import { pathsToModuleNameMapper } from 'ts-jest';

const { compilerOptions } = require('../../../tsconfig.base.json') as {
  compilerOptions: { paths: Record<string, string[]> };
};

export default {
  displayName: 'shared-events',
  preset: '../../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  moduleNameMapper:
    pathsToModuleNameMapper(compilerOptions.paths, {
      prefix: '<rootDir>/../../../',
    }) ?? {},
  coverageDirectory: '../../../coverage/libs/shared/events',
};
