// workers/engineCore.ts — the PURE worker logic (scaffold §4.4 / §4.3).
//
// Everything the Worker does to the live engine state, factored out as pure
// functions with ZERO Worker/DOM-global dependencies (no self, no postMessage,
// no setInterval, no MessageEvent). This is what makes the boundary-second
// handoff (prepareReInit) and the player-driven BUY/CLICK/TIER_UP/TICK paths
// unit-testable in Node/Vitest without spawning a real Worker (Workers do not
// exist in Node).
//
// engine.worker.ts is a thin impure shell over these helpers: it owns the
// timers + the postMessage channel and routes Actions through these functions.
//
// Player-driven: applyBuy validates affordability via core.cost (NOT strategy).
// strategy.decideAction is only used by reconstructFromOfflineWindow (the
// offline path) and the harnesses — never on the live tick.

import * as core from '../engine/core';
import * as runner from '../engine/runner';
import * as strategy from '../engine/strategy';
import { reconstructFromOfflineWindow } from '../engine/offline';
import { UPGRADES, DEFAULT_PARAMS } from '../engine/data';
import { CAUSAL_CONNECTIONS_PLACEHOLDER } from './protocol';
import type {
  EngineState,
  EngineSnapshot,
  Params,
  Upgrade,
  Carry,
} from '../engine/types';

export const CONSOLIDATION_EPS = 1e-9;

// MAX_TIER from the upgrade tree: the highest implemented tier. Mirrors
// offline.ts's derivation. Auto-expands as new tiers' upgrades land.
export function maxTierFor(upgrades: Upgrade[]): number {
  return Math.max(...upgrades.map(u => (u.tier == null ? 1 : u.tier)));
}

// Consolidation threshold for a tier under the canonical engine formula
//   threshold_T_n = base × growth^(n-1)
// (Same formula runner.buildTierConfig + offline use.)
export function consolidationThresholdForTier(tier: number): number {
  const base = DEFAULT_PARAMS.consolidationThreshold;
  const growth = DEFAULT_PARAMS.consolidationGrowth;
  return base * Math.pow(growth, tier - 1);
}

// A fresh T1 EngineState (INIT state=null → new universe).
export function freshEngineState(now: number = Date.now()): EngineState {
  const levels: Record<string, number> = {};
  for (const u of UPGRADES) levels[u.name] = 0;
  return {
    mass: 0,
    consolidation: 0,
    currentTier: 1,
    levels,
    carry: { allMps: 1.0, allMpc: 1.0, allAps: 1.0, carryMps: 0, carryMpc: 0, carryAps: 0 },
    consolidationThreshold: consolidationThresholdForTier(1),
    consolidationHitMs: null,
    totalClicks: 0,
    sessionStart: now,
    totalPausedMs: 0,
    massGainedClicks: 0,
    massGainedPassive: 0,
    massGainedAuto: 0,
    tickCount: 0,
    tierSnapshots: [{
      tier: 1, startMs: 0, thresholdHitMs: null, endMs: null,
      levelsAtEnd: null, massAtEnd: null, consolidationHitMs: null,
    }],
  };
}

// Defensive deep-ish clone of an incoming EngineState so the Worker owns a
// private mutable copy (the caller's INIT payload is never mutated).
export function cloneEngineState(s: EngineState, now: number = Date.now()): EngineState {
  return {
    mass: s.mass || 0,
    consolidation: s.consolidation || 0,
    currentTier: s.currentTier || 1,
    levels: Object.assign({}, s.levels || {}),
    carry: Object.assign(
      { allMps: 1.0, allMpc: 1.0, allAps: 1.0, carryMps: 0, carryMpc: 0, carryAps: 0 },
      s.carry || {},
    ) as Carry,
    consolidationThreshold: s.consolidationThreshold || consolidationThresholdForTier(s.currentTier || 1),
    consolidationHitMs: s.consolidationHitMs == null ? null : s.consolidationHitMs,
    totalClicks: s.totalClicks || 0,
    sessionStart: s.sessionStart || now,
    totalPausedMs: s.totalPausedMs || 0,
    massGainedClicks: s.massGainedClicks || 0,
    massGainedPassive: s.massGainedPassive || 0,
    massGainedAuto: s.massGainedAuto || 0,
    tickCount: s.tickCount || 0,
    tierSnapshots: (s.tierSnapshots || []).map(snap => Object.assign(
      {}, snap,
      { levelsAtEnd: snap && snap.levelsAtEnd ? Object.assign({}, snap.levelsAtEnd) : null },
    )),
  };
}

export interface PrepareReInitResult {
  state: EngineState;
  offlineReturn: { elapsedSec: number; massGained: number } | null;
}

// prepareReInit — PURE re-INIT / offline-handoff helper (§4.3 / §12.1).
//
// Given an incoming saved state and an offline-window length in seconds, accrue
// the pure-idle window (cpm 0, allowPurchases false) and return the post-window
// state plus a welcome-back summary. Boundary-second discipline: the window is
// the integer-second floor of the gap, and the Worker resets its tick
// accumulator to `now` AFTER this returns, so the live loop's first accrual
// lands at the NEXT whole second — the boundary second is counted exactly once,
// never double-counted across the offline→live handoff (the highest-attention
// gotcha, §12.1).
//
//   state=null       → fresh universe; no accrual; offlineReturn=null.
//   offlineSec <= 0  → clone-through; no accrual; offlineReturn=null.
//   offlineSec  > 0  → reconstructFromOfflineWindow pure-idle; offlineReturn
//                      carries elapsed seconds + mass gained for the dignified
//                      welcome-back surface (load-bearing return rule).
//
// validate_offline.test.ts exercises this directly: a continuous 600 s window
// must equal the same window split into two re-INIT segments within the ≤0.1%
// drift tolerance — the dedicated handoff parity assertion.
export function prepareReInit(
  state: EngineState | null,
  offlineSec: number,
  now: number = Date.now(),
): PrepareReInitResult {
  if (state == null) {
    return { state: freshEngineState(now), offlineReturn: null };
  }
  const cloned = cloneEngineState(state, now);
  const sec = Math.floor(offlineSec);
  if (!Number.isFinite(sec) || sec <= 0) {
    return { state: cloned, offlineReturn: null };
  }
  const massBefore = cloned.mass;
  const result = reconstructFromOfflineWindow(cloned, sec, {
    cpm: 0,
    allowPurchases: false,
  });
  const newState = result.newState as EngineState;
  const massGained = newState.mass - massBefore;
  return {
    state: newState,
    offlineReturn: { elapsedSec: result.ticks, massGained },
  };
}

// Derive the active-tier upgrade slice (re-resolved on tier-up).
export function activeUpgradesFor(tier: number): Upgrade[] {
  return runner.upgradesForTier(UPGRADES, tier);
}

// Build the carry object core.computeRates expects from an EngineState.
function carryForCompute(s: EngineState) {
  return {
    allMps: s.carry.allMps, allMpc: s.carry.allMpc, allAps: s.carry.allAps,
    carryMps: s.carry.carryMps, carryMpc: s.carry.carryMpc, carryAps: s.carry.carryAps,
  };
}

// computeLiveRates — composed rates for the current state, using the full
// UPGRADES list as the synergy-provider list so cross-tier synergies resolve.
export function computeLiveRates(
  s: EngineState,
  activeUpgrades: Upgrade[],
  params: Params,
): core.Rates {
  return core.computeRates(
    s as core.RateState,
    activeUpgrades,
    carryForCompute(s),
    { baseMpc: params.baseMpc },
    UPGRADES,
  );
}

// effectiveEngagement — per-tier curve × global override (mirrors runner).
function effectiveEngagement(tier: number, params: Params): number {
  const curve = params.perTierEngagement;
  const perTier = (curve && curve[tier] != null && Number.isFinite(curve[tier]))
    ? curve[tier] : null;
  return perTier != null ? perTier * params.engagement : params.engagement;
}

// applyTick — PURE one-second accrual. Mirrors the prototype playtest tick():
//   mass += mps (passive) + aps × mpc (auto)
// Click income is NOT accrued here — clicks arrive as discrete CLICK actions.
// The dev autoclicker (worker-runtime param, off in the shipped game) feeds
// click income through the same channel a tap would. Mutates `s`.
export function applyTick(
  s: EngineState,
  activeUpgrades: Upgrade[],
  params: Params,
): EngineState {
  const rates = computeLiveRates(s, activeUpgrades, params);
  const passInc = rates.mps;
  const autoInc = rates.aps * rates.mpc;
  s.mass += passInc + autoInc;
  s.massGainedPassive += passInc;
  s.massGainedAuto += autoInc;
  s.tickCount += 1;

  if (params.autoclickerOn && params.autoCpm && params.autoCpm > 0) {
    const eng = effectiveEngagement(s.currentTier, params);
    const clickInc = rates.mpc * (params.autoCpm / 60) * eng;
    s.mass += clickInc;
    s.massGainedClicks += clickInc;
    s.totalClicks += (params.autoCpm / 60) * eng;
  }
  return s;
}

// applyClick — PURE tap-income accrual. One tap == one mpc of mass (mirrors the
// prototype pull(): state.mass += computeMpc()). count batches taps. Mutates s.
export function applyClick(
  s: EngineState,
  activeUpgrades: Upgrade[],
  params: Params,
  count: number,
): EngineState {
  const rates = computeLiveRates(s, activeUpgrades, params);
  const inc = rates.mpc * count;
  s.mass += inc;
  s.massGainedClicks += inc;
  s.totalClicks += count;
  return s;
}

export type BuyOutcome =
  | { ok: true; upgrade: string; level: number }
  | { ok: false; upgrade: string; reason: 'unaffordable' | 'maxed' | 'unknown' };

// applyBuy — PURE player-driven purchase. Validates affordability authoritatively
// via core.cost (NOT strategy). On success: decrement mass, increment level,
// add consolidation. Mutates s. Returns the outcome the worker relays as
// PURCHASE_OK / PURCHASE_REJECTED.
export function applyBuy(
  s: EngineState,
  activeUpgrades: Upgrade[],
  upgradeName: string,
): BuyOutcome {
  const u = activeUpgrades.find(x => x.name === upgradeName);
  if (!u) return { ok: false, upgrade: upgradeName, reason: 'unknown' };
  const level = s.levels[u.name] || 0;
  const c = core.cost(u, level);
  if (c == null) return { ok: false, upgrade: upgradeName, reason: 'maxed' };
  if (s.mass < c) return { ok: false, upgrade: upgradeName, reason: 'unaffordable' };
  s.mass -= c;
  s.levels[u.name] = level + 1;
  s.consolidation += u.consolidation;
  const snap = s.tierSnapshots[s.currentTier - 1];
  if (snap && snap.consolidationHitMs == null
      && s.consolidation + CONSOLIDATION_EPS >= s.consolidationThreshold) {
    const hitMs = s.tickCount * 1000;
    snap.consolidationHitMs = hitMs;
    if (s.consolidationHitMs == null) s.consolidationHitMs = hitMs;
  }
  return { ok: true, upgrade: u.name, level: s.levels[u.name] };
}

export type TierUpOutcome =
  | { ok: true; fromTier: number; toTier: number }
  | { ok: false; reason: 'gate-closed' | 'max-tier' };

// applyTierUp — PURE consolidation-gate commit. Recomposes carry across ALL
// prior tiers via runner.composeCarryChain (the clean cross-tier path, not the
// prototype's immediate-prior chaining), advances the tier, resets
// consolidation, opens a new tier snapshot. Mutates s.
export function applyTierUp(s: EngineState): TierUpOutcome {
  const maxTier = maxTierFor(UPGRADES);
  if (s.consolidation + CONSOLIDATION_EPS < s.consolidationThreshold) {
    return { ok: false, reason: 'gate-closed' };
  }
  if (s.currentTier >= maxTier) {
    return { ok: false, reason: 'max-tier' };
  }
  const fromTier = s.currentTier;
  const toTier = fromTier + 1;
  const oldSnap = s.tierSnapshots[fromTier - 1];
  if (oldSnap) {
    oldSnap.endMs = s.tickCount * 1000;
    oldSnap.massAtEnd = s.mass;
    oldSnap.levelsAtEnd = Object.assign({}, s.levels);
  }
  // Recompose carry across T1..toTier-1 from the full levels map (Option C
  // "no frozen floors"): cumulative all-mult products + RAW Σ self·syn floors.
  // The live loop re-multiplies floors by the live all-mult every tick via
  // core.computeRates, so later-tier multipliers amplify earlier contributions
  // exactly as the load-bearing carry rule demands.
  const cp = runner.composeCarryChain(
    { mass: s.mass, levels: s.levels },
    toTier, UPGRADES, { baseMpc: DEFAULT_PARAMS.baseMpc }, core,
  );
  s.carry = {
    allMps: cp.carry.allMps,
    allMpc: cp.carry.allMpc,
    allAps: cp.carry.allAps,
    carryMps: cp.carryMps,
    carryMpc: cp.carryMpc,
    carryAps: cp.carryAps,
  };
  s.currentTier = toTier;
  s.consolidationThreshold = consolidationThresholdForTier(toTier);
  s.consolidation = 0;
  s.tierSnapshots.push({
    tier: toTier, startMs: s.tickCount * 1000, thresholdHitMs: null,
    endMs: null, levelsAtEnd: null, massAtEnd: null, consolidationHitMs: null,
  });
  return { ok: true, fromTier, toTier };
}

// applySkipToTier — PURE dev jump to tier N. Reuses applyTierUp repeatedly so
// the carry recompose path is identical to a real climb (no special-casing).
// Forces the gate open at each step by setting consolidation to the threshold.
// Refuses tiers <= current or > MAX_TIER.
export function applySkipToTier(s: EngineState, targetTier: number): boolean {
  const maxTier = maxTierFor(UPGRADES);
  if (targetTier <= s.currentTier || targetTier > maxTier) return false;
  while (s.currentTier < targetTier) {
    s.consolidation = s.consolidationThreshold;
    const out = applyTierUp(s);
    if (!out.ok) return false;
  }
  return true;
}

export interface AutoStepResult {
  transitioned: boolean;
  fromTier?: number;
  toTier?: number;
}

// applyAutoStep — PURE one strategy decision applied to the LIVE state (dev
// "self-play"). Runs strategy.decideAction (the SAME strategy the offline /
// fast-forward auto-buy uses) and applies the chosen action via the same pure
// helpers a player path uses (applyBuy / applyTierUp), so live auto-buy is
// byte-consistent with manual play — realistic, just hands-free. One decision
// per call (the worker calls it once per applied tick); 'save'/'none' are no-ops.
// Click income is NOT added here — it comes from applyTick's autoclicker channel
// (pair auto-buy with the autoclicker for income). Mutates s.
export function applyAutoStep(
  s: EngineState,
  activeUpgrades: Upgrade[],
  params: Params,
): AutoStepResult {
  const mode = params.autoBuyMode === 'threshold' ? 'threshold' : 'completion';
  const saveVpcThreshold = typeof params.autoBuySaveVpc === 'number' ? params.autoBuySaveVpc : 1.5;
  // The strategy values click upgrades against an assumed click rate; feed it the
  // live autoclicker rate so its view of click income matches what applyTick adds.
  const cpm = params.autoclickerOn && params.autoCpm ? params.autoCpm : 0;
  const stratParams = {
    cpm,
    engagement: params.engagement,
    saveVpcThreshold,
    consolidationThreshold: s.consolidationThreshold,
    baseMpc: params.baseMpc,
    baseMps: 0.0,
    carry: { allMps: s.carry.allMps, allMpc: s.carry.allMpc, allAps: s.carry.allAps },
    carryMps: s.carry.carryMps,
    carryMpc: s.carry.carryMpc,
    carryAps: s.carry.carryAps,
    synergyProviders: UPGRADES,
    mode,
    longSaveTimeThresholdSec: 90,
    longSaveTolerance: 1.05,
    perTierEngagement: params.perTierEngagement,
  };
  const action = strategy.decideAction(s, stratParams, activeUpgrades);
  if (action.action === 'transition') {
    const out = applyTierUp(s);
    if (out.ok) return { transitioned: true, fromTier: out.fromTier, toTier: out.toTier };
    return { transitioned: false };
  }
  if (action.action === 'buy') {
    applyBuy(s, activeUpgrades, action.upgrade);
  }
  return { transitioned: false };
}

// deriveSnapshot — PURE EngineState → EngineSnapshot projection (§4.2).
export function deriveSnapshot(
  s: EngineState,
  activeUpgrades: Upgrade[],
  params: Params,
  seq: number,
  paused: boolean,
  recentPurchase: { name: string; tier: number; level: number } | null,
  recentTierUp: { fromTier: number; toTier: number } | null,
  offlineReturn: { elapsedSec: number; massGained: number } | null,
): EngineSnapshot {
  const rates = computeLiveRates(s, activeUpgrades, params);
  const affordable: string[] = [];
  for (const u of activeUpgrades) {
    const level = s.levels[u.name] || 0;
    const c = core.cost(u, level);
    if (c != null && s.mass >= c) affordable.push(u.name);
  }
  // The current tier's start (sim seconds). tierSnapshots is index-aligned to
  // tier number (index = tier - 1); startMs is in sim-milliseconds (typed via the
  // element's index signature, so read defensively). Fallback 0 if absent.
  const startMsRaw = s.tierSnapshots[s.currentTier - 1]?.startMs;
  const tierStartSec = typeof startMsRaw === 'number' ? startMsRaw / 1000 : 0;
  return {
    seq,
    mass: s.mass,
    mps: rates.mps,
    mpc: rates.mpc,
    aps: rates.aps,
    currentTier: s.currentTier,
    consolidation: s.consolidation,
    consolidationThreshold: s.consolidationThreshold,
    consolidationReady: s.consolidation + CONSOLIDATION_EPS >= s.consolidationThreshold,
    levels: Object.assign({}, s.levels),
    affordable,
    recentPurchase,
    recentTierUp,
    causalConnections: CAUSAL_CONNECTIONS_PLACEHOLDER,
    paused,
    tickCount: s.tickCount,
    tierStartSec,
    offlineReturn,
  };
}

// Merge a Partial<Params> patch over the live params (SET_PARAMS / TIME_SKIP).
export function mergeParams(base: Params, patch: Partial<Params>): Params {
  return Object.assign({}, base, patch);
}
