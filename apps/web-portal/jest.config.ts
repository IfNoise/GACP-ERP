import { pathsToModuleNameMapper } from 'ts-jest';

const { compilerOptions } = require('../../tsconfig.base.json') as {
  compilerOptions: { paths: Record<string, string[]> };
};

export default {
  displayName: 'web-portal',
  preset: '../../jest.preset.js',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.[tj]sx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleNameMapper: {
    ...pathsToModuleNameMapper(compilerOptions.paths, {
      prefix: '<rootDir>/../../',
    }),
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  coverageDirectory: '../../coverage/apps/web-portal',
};
