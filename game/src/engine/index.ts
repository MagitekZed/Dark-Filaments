// engine/index.ts — the engine's complete public surface (scaffold plan §4.1).
//
// The barrel re-exports exactly what the Worker and harnesses need. No other
// module in game/ imports from engine/ except the Worker and the test files.
// (The store reads snapshots, not the engine; the scene reads the store.) This
// is the seam that keeps the engine pure.
//
// Engine purity (ESLint no-restricted-imports, eslint.config.js): files under
// engine/** may not import react / three / @react-three/* / zustand or any
// ../scene / ../ui / ../store / ../workers path. sweep.ts and profiles.ts live
// under engine/ (pure data/sim) but are NOT in this barrel — the harnesses
// import them directly. They satisfy the purity rule.

export {
  UPGRADES, DEFAULT_PARAMS, SAVE_VERSION, TIERS,
} from './data';
export {
  selfContrib, synergyMult, computeRates, cost, getUpgradeFlavor,
  // computeMpc/Mps/Aps retained as named exports for harness parity even though
  // computeRates is the live path — the prototype exports them and parity asserts on them.
  computeMpc, computeMps, computeAps,
} from './core';
export {
  runSimulation, composeCarryChain, computeCarryover, upgradesForTier, TIER_CONFIGS,
} from './runner';
export {
  decideAction, classify, stackableVpc, oneShotVpc,
} from './strategy';
export { reconstructFromOfflineWindow } from './offline';
export {
  serializeState, deserializeState, encodeToken, decodeToken, computeSchemaSig,
} from './save';
export type {
  EngineState, SavePayloadV5, Upgrade, Carry, Params, EngineSnapshot,
  Action, TierMeta, BuyLogEntry, Milestone,
} from './types';
