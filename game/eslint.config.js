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
  // R3F render layer (scaffold §6.1: "components move verbatim — they're clean
  // R3F, hardware-proven; preserve the seeded-RNG + primitive-useMemo-deps
  // pattern exactly"). eslint-plugin-react-hooks v7 ships the React-Compiler
  // purity/immutability rules, which are fundamentally incompatible with the
  // R3F idiom: useFrame callbacks MUST mutate refs/objects every frame, and the
  // procedural generators legitimately call Math.random() (seeded or per-frame).
  // These are the proven patterns the absorption is told to preserve verbatim,
  // not bugs. We turn off only the compiler-style rules here; rules-of-hooks +
  // exhaustive-deps still apply. Scene files also legitimately co-export
  // authoring constants (PLANETS, sceneParamsForTier, …) and the registry
  // component lookup, so react-refresh/only-export-components and
  // static-components are relaxed for this layer too.
  {
    files: ['src/scene/**/*.{ts,tsx}'],
    rules: {
      'react-hooks/purity': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/static-components': 'off',
      'react-refresh/only-export-components': 'off',
      // The spike's reset-then-recompute patterns (e.g. dx/dy/dz reused after a
      // guard) read as "useless assignment" to the linter but are intentional.
      'no-useless-assignment': 'off',
    },
  },
  // Scene-reads-store seam (scaffold §12.7): scene modules read engine state via
  // the store/selectors, NEVER the Worker. The ONE sanctioned exception is the
  // tap-handler wiring in CosmicCanvas (sendClick). This rule blocks every other
  // scene module from importing workers/ (engineClient / engine.worker /
  // protocol). CosmicCanvas is exempted by the override below.
  {
    files: ['src/scene/**/*.{ts,tsx}'],
    ignores: ['src/scene/CosmicCanvas.tsx'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          {
            group: ['**/workers/**', '../workers', '../../workers'],
            message: 'scene/** reads the STORE, never the Worker (§12.7). Only CosmicCanvas wires the tap handler (sendClick).',
          },
        ],
      }],
    },
  },
])
