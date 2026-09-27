import js from '@eslint/js'
import tseslint from 'typescript-eslint'

// Mirrors the root wicker-money eslint.config.js style. This repo is
// standalone (not part of that pnpm workspace), so the config is kept
// minimal rather than importing shared rules across repos.
export default tseslint.config(
  {
    ignores: ['**/build/**', '**/.docusaurus/**', '**/node_modules/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['docusaurus.config.ts', 'sidebars.ts'],
    languageOptions: {
      globals: { process: 'readonly' },
    },
  },
)
