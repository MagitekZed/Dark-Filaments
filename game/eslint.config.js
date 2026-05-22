import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

// The engine purity seam (engineering-plan §4.1): files under src/engine/** are
// pure, headless TypeScript. They must never reach into the render stack, state
// store, scene, UI, or workers. This rule is the CI-enforceable guard. The
// engine/ dir is empty in G0 — the rule has nothing to catch yet, but the seam
// is in place before G1 ports any engine code.
const engineForbiddenPatterns = [
  { group: ['react', 'react-dom', 'react-dom/*'], message: 'engine/** must stay pure: no React.' },
  { group: ['three', 'three/*'], message: 'engine/** must stay pure: no Three.js.' },
  { group: ['@react-three/*'], message: 'engine/** must stay pure: no R3F/drei.' },
  { group: ['zustand', 'zustand/*'], message: 'engine/** must stay pure: no Zustand.' },
  {
    group: ['**/scene/**', '**/ui/**', '**/store/**', '**/workers/**'],
    message: 'engine/** must not import from scene/ui/store/workers.',
  },
]

export default defineConfig([
  globalIgnores(['dist', 'playwright-report', 'test-results', '.vite']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // Ports keep parameters/locals that are part of a function's public
      // contract even when a given body doesn't read them (e.g. strategy
      // stackableVpc's `_classification`, runner's voided signature params).
      // The leading-underscore convention marks them intentional.
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['src/engine/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: engineForbiddenPatterns }],
    },
  },
])
