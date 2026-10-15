const js = require('@eslint/js');
const stylistic = require('@stylistic/eslint-plugin');
const tseslint = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');

module.exports = [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'lib/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs['flat/recommended'],
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      globals: {
        describe: 'readonly',
        expect: 'readonly',
        it: 'readonly',
      },
    },
    plugins: {
      '@stylistic': stylistic,
    },
    rules: {
      semi: 'off',
      '@stylistic/semi': ['error'],
      '@stylistic/member-delimiter-style': 'error',
      quotes: ['error', 'single'],
    },
  },
];
