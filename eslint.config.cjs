const js = require('@eslint/js');
const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const reactHooks = require('eslint-plugin-react-hooks');
const globals = require('globals');
const prettier = require('eslint-config-prettier');

const tsFiles = ['**/*.{ts,tsx}', 'vite.config.ts', 'playwright.config.ts'];

module.exports = [
  {
    ignores: ['build/**', 'node_modules/**'],
  },
  js.configs.recommended,
  ...tsPlugin.configs['flat/recommended'].map((config) => ({
    ...config,
    files: tsFiles,
    languageOptions: {
      ...(config.languageOptions ?? {}),
      parser: tsParser,
      parserOptions: {
        ...(config.languageOptions?.parserOptions ?? {}),
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
          ...(config.languageOptions?.parserOptions?.ecmaFeatures ?? {}),
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...(config.languageOptions?.globals ?? {}),
      },
    },
  })),
  {
    files: tsFiles,
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.flat.recommended.rules,
      ...prettier.rules,
      'react-hooks/set-state-in-effect': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },
];
