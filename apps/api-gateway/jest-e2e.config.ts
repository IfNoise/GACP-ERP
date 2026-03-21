import { pathsToModuleNameMapper } from 'ts-jest';

const { compilerOptions } = require('../../tsconfig.base.json') as {
  compilerOptions: { paths: Record<string, string[]> };
};

export default {
  displayName: 'api-gateway-e2e',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': [
      '@swc/jest',
      {
        jsc: {
          parser: { syntax: 'typescript', decorators: true },
          transform: { legacyDecorator: true, decoratorMetadata: true },
          target: 'es2022',
        },
      },
    ],
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  moduleNameMapper:
    pathsToModuleNameMapper(compilerOptions.paths, {
      prefix: '<rootDir>/../../',
    }) ?? {},
  testMatch: ['<rootDir>/test/**/*.e2e-spec.ts'],
  setupFiles: ['<rootDir>/test/helpers/patch-metadata.ts'],
  testPathIgnorePatterns: ['/node_modules/'],
};
