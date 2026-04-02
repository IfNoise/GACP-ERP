// @ts-check
const nx = require('@nx/eslint-plugin');

/** @type {import('eslint').Linter.FlatConfig[]} */
module.exports = [
  // NX flat configs already bundle @typescript-eslint plugin + parser
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],

  // Global ignores
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/.nx/**',
      '**/.next/**',
      '**/next-env.d.ts',
      '**/coverage/**',
      '**/tmp/**',
      'landing/**',
      'dsl/**',
      'docs/**',
    ],
  },

  // TypeScript files — strict rules added ON TOP of NX defaults
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // DISABLED: consistent-type-imports adds `type` to DI class imports,
      // which breaks NestJS emitDecoratorMetadata (erases class references
      // at compile time → DI receives undefined). Requires type-aware linting
      // (parserOptions.project) to detect decorator metadata usage, but that
      // cannot run reliably from the repo root during lint-staged.
      '@typescript-eslint/consistent-type-imports': 'off',
      // NOTE: no-floating-promises / no-misused-promises require type info
      // (parserOptions.project). They cannot run reliably from the repo root
      // during lint-staged without a per-project tsconfig context.
      // Enable these rules in per-project eslint configs or via: nx lint <project>
      'no-unused-vars': 'off',
      'no-undef': 'off',
    },
  },

  // JS/CJS config files — relax TS rules
  {
    files: ['**/*.js', '**/*.jsx', '**/*.mjs', '**/*.cjs'],
    rules: {
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
];
