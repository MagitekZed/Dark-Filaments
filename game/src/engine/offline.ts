// Dark Filaments — offline accrual math
// Long-burn v1, Engineering Phase 3 (E3).
//
// Owns `reconstructFromOfflineWindow` — the load-bearing artifact of v1, per
// engineering-plan-long-burn-v1.md §2. A pure function: same inputs always
// produce same outputs. Used in three places:
//   1. App boot (sim/save.js -> ui/playtest.js) when restoring from a save
//      with a non-zero (now - savedAt) gap.
//   2. Dev time-skip (sim/devtools — Phase E4).
//   3. Harness simulation (test/harness.js — Phase S2+) — slices a multi-week
//      playthrough into engagement-profile windows and calls this function
//      for each.
//
// TS port (scaffold plan §5.1): IIFE wrapper + UMD shim stripped; the lazy
// deps()/require() resolution replaced with plain ES imports. Every numeric
// literal + computation preserved byte-identical.
//
// API contract:
//   reconstructFromOfflineWindow(savedState, elapsedSeconds, profileParams)
//     -> { newState, buyLog, milestones, endReason, ticks }
//
// Inputs:
//   savedState      — SavePayload.game-shaped object (canonical names:
//                     carry.carryMps/carryMpc/carryAps + carry.allMps/allMpc/allAps).
//                     Must contain: mass, consolidation, currentTier, levels, carry,
//                     consolidationThreshold, consolidationHitMs, totalClicks, sessionStart,
//                     totalPausedMs, massGainedClicks, massGainedPassive,
//                     massGainedAuto, tickCount, tierSnapshots. Not mutated.
//   elapsedSeconds  — window length to simulate (caller applies 24 h cap or
//                     other policy). Floats are floored to integer ticks.
//   profileParams   — { cpm, engagement, allowPurchases, mode, saveVpcThreshold,
//                       longSaveTimeThresholdSec, longSaveTolerance,
//                       perTierEngagement?, upgrades? }
//                     - cpm/engagement: per-tick click income scale. Boot-time
//                       call sets cpm = 0 → click income = 0 across the window.
//                     - allowPurchases: false (default) → strategy.decideAction
//                       is NOT called; mass purely accrues from MPS + APS × MPC.
//                       Honors the load-bearing rule "Consolidation does not
//                       advance without active purchase decisions — purchase
//                       is the only mechanism that converts stored mass into
//                       structural progress" (CLAUDE.md, the "universe is
//                       patient" rule).
//                     - mode: "completion" | "threshold" — only meaningful when
//                       allowPurchases is true; gates completionist purchases
//                       per strategy.js's existing mask.
//                     - perTierEngagement: optional override of the default
//                       per-tier curve. Defaults from DEFAULT_PARAMS.
//                     - upgrades: optional override upgrade slice (defaults to
//                       data.UPGRADES).
//
// Returns:
//   newState        — SavePayload.game-shaped object reflecting the post-window
//                     state. All counters (mass, mass-gained*, totalClicks,
//                     tickCount, consolidation, currentTier, levels, carry) advanced
//                     accordingly. tierSnapshots updated when a tier transition
//                     fires inside the window.
//   buyLog          — Array<{ tick, time_s, action, upgrade?, cost?, target?,
//                     tier }> — one entry per non-"none"/non-"save" action.
//                     Boot-time (allowPurchases = false) yields []. Used by the
//                     harness (S2+) and by E4's dev-time-skip log.
//   milestones      — Array<{ tick, time_s, kind, tier?, name? }> where kind is
//                     "threshold-hit" | "tier-up" | "completionist".
//   endReason       — "wallclock-exhausted" (full window simulated),
//                     "max-tier-reached" (currentTier hit MAX_TIER and
//                     transition was attempted), or "max-ticks-exceeded"
//                     (safety cap; very unlikely for sensible windows).
//   ticks           — number of seconds (= ticks at 1 Hz) actually simulated.
//
// Numerical drift policy (per engineering plan §3 dt strategy):
//   "the patient universe is continuous in the design but the engine is 1 Hz.
//    For offline windows, integrate analytically by summing 1 s ticks in a
//    loop." — we do exactly that. validate_offline.js asserts <=0.1% delta on
//    mass over a 10-minute replay vs runner.runSimulation. If/when calendar-
//    scale windows make 1 Hz integration slow (~30 s per pairing), the §3
//    note authorizes an N-second-block closed-form optimization between
//    purchase events. For E3 we ship the brute-force 1 Hz path.

import * as core from './core';
import * as strategy from './strategy';
import * as runner from './runner';
import * as data from './data';
import type { ProfileParams, Upgrade } from './types';

type AnyState = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

// 1 Hz safety ceiling. 30 days at 1 s/tick = 2.59M ticks. The boot-time
// call caps elapsedSeconds at 24 h (= 86400 ticks); the harness will slice
// even longer windows into shorter pieces. This is a defensive bound that
// prevents a malformed elapsedSeconds (e.g. NaN, negative coerced through)
// from spinning the engine forever.
export const MAX_OFFLINE_TICKS = 30 * 24 * 3600;

// Shallow-clone a SavePayload.game-shaped object into a mutable working state
// local to this function call. We never mutate the input; the harness assumes
// pure-function semantics so it can replay the same savedState across many
// (elapsedSeconds, profileParams) configurations.
function cloneSavedState(s: AnyState): AnyState {
  return {
    mass: s.mass || 0,
    consolidation: s.consolidation || 0,
    currentTier: s.currentTier || 1,
    levels: Object.assign({}, s.levels || {}),
    carry: Object.assign(
      { allMps: 1.0, allMpc: 1.0, allAps: 1.0, carryMps: 0, carryMpc: 0, carryAps: 0 },
      s.carry || {},
    ),
    consolidationThreshold: s.consolidationThreshold || 0,
    consolidationHitMs: s.consolidationHitMs == null ? null : s.consolidationHitMs,
    totalClicks: s.totalClicks || 0,
    sessionStart: s.sessionStart || 0,
    totalPausedMs: s.totalPausedMs || 0,
    massGainedClicks: s.massGainedClicks || 0,
    massGainedPassive: s.massGainedPassive || 0,
    massGainedAuto: s.massGainedAuto || 0,
    tickCount: s.tickCount || 0,
    tierSnapshots: (s.tierSnapshots || []).map((snap: AnyState) => Object.assign(
      {}, snap,
      { levelsAtEnd: snap && snap.levelsAtEnd ? Object.assign({}, snap.levelsAtEnd) : null },
    )),
  };
}

// Recompute the working state's carry from its current `levels` for the
// currently-active tier. Used after a tier transition: walks T1..currentTier-1
// and accumulates raw Σ self·syn floors + cumulative all-mult products.
// Identical math to runner.composeCarryChain — we call it directly.
function recomputeCarryAtTier(
  workingState: AnyState,
  currentTier: number,
  allUpgrades: Upgrade[],
  coreMod: typeof core,
  runnerMod: typeof runner,
): void {
  if (currentTier <= 1) {
    workingState.carry = { allMps: 1.0, allMpc: 1.0, allAps: 1.0, carryMps: 0, carryMpc: 0, carryAps: 0 };
    return;
  }
  const cp = runnerMod.composeCarryChain(
    { mass: workingState.mass, levels: workingState.levels },
    currentTier, allUpgrades, { baseMpc: 1.0 }, coreMod,
  );
  workingState.carry = {
    allMps: cp.carry.allMps,
    allMpc: cp.carry.allMpc,
    allAps: cp.carry.allAps,
    carryMps: cp.carryMps,
    carryMpc: cp.carryMpc,
    carryAps: cp.carryAps,
  };
}

// Consolidation threshold for tier t under the canonical engine formula
//   consolidationThreshold_T_n = base × growth^(n-1)
// Same as ui/playtest.js's consolidationThresholdForTier. Inlined to keep
// offline.js free of UI dependencies.
function consolidationThresholdForTier(tier: number, dataMod: typeof data): number {
  const base = dataMod.DEFAULT_PARAMS.consolidationThreshold;
  const growth = dataMod.DEFAULT_PARAMS.consolidationGrowth;
  return base * Math.pow(growth, tier - 1);
}

// Filter the master upgrade list to the active tier. Mirrors
// runner.upgradesForTier (also exposed on DF.sim.runner).
function upgradesForTier(allUpgrades: Upgrade[], tier: number): Upgrade[] {
  return allUpgrades.filter(u => (u.tier == null ? 1 : u.tier) === tier);
}

export function reconstructFromOfflineWindow(
  savedState: AnyState,
  elapsedSeconds: number,
  profileParams: ProfileParams,
): {
  newState: AnyState;
  buyLog: AnyState[];
  milestones: AnyState[];
  endReason: string;
  ticks: number;
} {
  const allUpgrades = (profileParams && profileParams.upgrades) || data.UPGRADES;
  // MAX_TIER from the upgrade-tree: the highest implemented tier. Reflects
  // current T1-T4 reality; auto-expands as new tiers come online.
  const MAX_TIER = Math.max(...allUpgrades.map(u => (u.tier == null ? 1 : u.tier)));
  // baseMpc reads from DEFAULT_PARAMS so the M☉ retune (2026-05-12) flows
  // through: DEFAULT_PARAMS.baseMpc 1.0→0.02 actually takes effect here.
  // Prior to this fix, baseMpc was hardcoded 1.0 at both the computeRates
  // call site and the strategy.decideAction stratParams, silently overriding
  // the engine-wide default and bypassing the retune entirely.
  const defaultBaseMpc = (data.DEFAULT_PARAMS && data.DEFAULT_PARAMS.baseMpc != null)
    ? data.DEFAULT_PARAMS.baseMpc : 1.0;

  const pp = profileParams || {};
  const cpm = (pp.cpm != null) ? pp.cpm : 0;
  const engagement = (pp.engagement != null) ? pp.engagement : 1.0;
  const allowPurchases = !!pp.allowPurchases;
  const mode = pp.mode || "completion";
  const saveVpcThreshold = (pp.saveVpcThreshold != null) ? pp.saveVpcThreshold : 1.5;
  const longSaveTimeThresholdSec = (pp.longSaveTimeThresholdSec != null)
    ? pp.longSaveTimeThresholdSec : 90;
  const longSaveTolerance = (pp.longSaveTolerance != null)
    ? pp.longSaveTolerance : 1.05;
  const perTierEngagement = pp.perTierEngagement
    || (data.DEFAULT_PARAMS && data.DEFAULT_PARAMS.perTierEngagement)
    || null;

  // Normalize ticks. Negative / NaN → 0 (caller bug; refuse silently).
  let ticks = Math.floor(elapsedSeconds);
  if (!Number.isFinite(ticks) || ticks < 0) ticks = 0;
  if (ticks > MAX_OFFLINE_TICKS) ticks = MAX_OFFLINE_TICKS;

  const ws = cloneSavedState(savedState);
  const buyLog: AnyState[] = [];
  const milestones: AnyState[] = [];
  let endReason = 'wallclock-exhausted';
  const CONSOLIDATION_EPS = 1e-9;

  // Resolve the active-tier upgrade slice once per tier; refresh on transitions.
  let activeUpgrades = upgradesForTier(allUpgrades, ws.currentTier);

  // Reading B anchor: peak in-tier mass at the moment the Consolidation gate
  // is crossed (NOT the exit-tick residual after the transition purchase).
  // Tracks the maximum mass observed within the current tier; reset to the
  // post-carry-recomposition mass on tier-up so the next tier starts fresh.
  // Stamped on the tier-up milestone's `mass` field so the harness mass-band
  // check compares like-with-like against the bot reference's headline.peakMass.
  let peakMassInTier = ws.mass;

  // simTick starts at 1 (the prototype's `let simTick = 0; for (simTick = 1; …)`
  // — the 0 initializer was never read, so we start at 1 directly; identical
  // behavior, including the post-loop `Math.min(simTick - 1, ticks)` read).
  let simTick = 1;
  for (; simTick <= ticks; simTick++) {
    // Build the carry object that core.computeRates expects every tick.
    // Shape mirrors runner.runSimulation's carryForCompute.
    const carryForCompute = {
      allMps: ws.carry.allMps, allMpc: ws.carry.allMpc, allAps: ws.carry.allAps,
      carryMps: ws.carry.carryMps, carryMpc: ws.carry.carryMpc, carryAps: ws.carry.carryAps,
    };

    // Effective engagement for the active tier — same algebra as runner.
    const perTier = (perTierEngagement && perTierEngagement[ws.currentTier] != null
                     && isFinite(perTierEngagement[ws.currentTier]))
      ? perTierEngagement[ws.currentTier]
      : null;
    const effEngagement = (perTier != null) ? perTier * engagement : engagement;

    // 1. Rates.
    const rates = core.computeRates(
      ws as core.RateState, activeUpgrades, carryForCompute,
      { baseMpc: defaultBaseMpc }, allUpgrades,
    );
    const mpc = rates.mpc, mps = rates.mps, aps = rates.aps;

    // 2. Income.
    const clickInc = mpc * cpm / 60 * effEngagement;
    const passInc = mps;
    const autoInc = aps * mpc;
    ws.mass += clickInc + passInc + autoInc;
    ws.massGainedClicks += clickInc;
    ws.massGainedPassive += passInc;
    ws.massGainedAuto += autoInc;
    ws.totalClicks += cpm / 60 * effEngagement;
    ws.tickCount += 1;
    // Reading B peak-mass tracking: sample AFTER income, BEFORE purchase. The
    // pre-purchase peak is what the counter reads at the moment the gate-
    // crossing purchase is committed.
    if (ws.mass > peakMassInTier) peakMassInTier = ws.mass;

    // Track threshold-hit per tier. consolidationHitMs on the working state stores
    // the FIRST tier's threshold-hit (same field semantics as playtest); the
    // tierSnapshots entry's consolidationHitMs gets per-tier-local timestamps.
    // We don't translate to wall-clock ms here — the simTick index is what
    // we have. The boot-time call site can stamp Date.now() later if needed.
    // For now, milestones carry simTick + time_s; tierSnapshots consolidationHitMs
    // stays null during offline (E1 freeze semantic: snapshots updated only
    // by player action, not by the offline runner).

    // Threshold-mode early exit guard — only meaningful if purchases are
    // enabled. Without purchases consolidation can never advance (it changes
    // only on buy events).
    const consolidationMet = ws.consolidation + CONSOLIDATION_EPS >= ws.consolidationThreshold;
    if (consolidationMet && !milestones.some(m => m.kind === 'threshold-hit' && m.tier === ws.currentTier)) {
      milestones.push({
        tick: simTick, time_s: simTick, kind: 'threshold-hit', tier: ws.currentTier,
      });
    }

    if (!allowPurchases) {
      // Pure-idle path: no decisions, no transitions. The universe is
      // patient and the player is away.
      continue;
    }

    // 3. Strategy decision.
    const stratParams = {
      cpm, engagement,
      saveVpcThreshold,
      consolidationThreshold: ws.consolidationThreshold,
      baseMpc: defaultBaseMpc,
      baseMps: 0.0,
      carry: { allMps: ws.carry.allMps, allMpc: ws.carry.allMpc, allAps: ws.carry.allAps },
      carryMps: ws.carry.carryMps,
      carryMpc: ws.carry.carryMpc,
      carryAps: ws.carry.carryAps,
      synergyProviders: allUpgrades,
      mode,
      longSaveTimeThresholdSec,
      longSaveTolerance,
      perTierEngagement,
    };
    const action = strategy.decideAction(ws, stratParams, activeUpgrades);

    // 4. Apply action.
    if (action.action === 'transition') {
      // Finalize the prior tier's snapshot if one is open.
      const lastSnap = ws.tierSnapshots[ws.tierSnapshots.length - 1];
      if (lastSnap && lastSnap.tier === ws.currentTier && lastSnap.endMs == null) {
        lastSnap.endMs = simTick * 1000;
        lastSnap.massAtEnd = ws.mass;
        lastSnap.levelsAtEnd = Object.assign({}, ws.levels);
      }
      if (ws.currentTier >= MAX_TIER) {
        endReason = 'max-tier-reached';
        milestones.push({
          tick: simTick, time_s: simTick, kind: 'tier-up',
          tier: ws.currentTier, name: 'max-tier-reached',
          // Reading B: peak in-tier mass at the gate-crossing moment, NOT
          // the post-purchase exit-tick residual. The peak is what the
          // counter read when the player committed the gate-crossing buy.
          mass: peakMassInTier,
        });
        break;
      }
      const fromTier = ws.currentTier;
      // Reading B peak-at-gate (apparatus fix 2026-05-13): stamp the peak
      // in-tier mass observed BEFORE this transition's purchase debited the
      // cost. The strategy fires `transition` only when the post-purchase
      // state would advance; the peak is therefore the last tick before
      // commit, which matches the player's counter at the structural-
      // completion moment. Replaces the prior exit-tick `ws.mass` read,
      // which captured only the small residual after the gate-cost debit.
      const peakAtGate = peakMassInTier;
      ws.currentTier = fromTier + 1;
      ws.consolidationThreshold = consolidationThresholdForTier(ws.currentTier, data);
      ws.consolidation = 0;
      ws.tierSnapshots.push({
        tier: ws.currentTier, startMs: simTick * 1000, thresholdHitMs: null,
        endMs: null, levelsAtEnd: null, massAtEnd: null, consolidationHitMs: null,
      });
      // Recompose carry across all prior tiers (1..currentTier-1).
      recomputeCarryAtTier(ws, ws.currentTier, allUpgrades, core, runner);
      // Refresh the active upgrade slice.
      activeUpgrades = upgradesForTier(allUpgrades, ws.currentTier);
      // Reset peak tracking for the new tier. The next tier starts fresh
      // from ws.mass (the post-transition mass, after any starting-mass
      // carry); peakMassInTier climbs from there as income accrues.
      peakMassInTier = ws.mass;
      milestones.push({
        tick: simTick, time_s: simTick, kind: 'tier-up',
        tier: ws.currentTier, name: 'T' + fromTier + '->T' + ws.currentTier,
        mass: peakAtGate,
      });
      buyLog.push({
        tick: simTick, time_s: simTick, action: 'transition',
        tier: fromTier,
      });
    } else if (action.action === 'buy') {
      // Defensive: the strategy returns cost based on the level it saw; we
      // re-check affordability here (matches runner's behavior).
      const u = activeUpgrades.find(x => x.name === action.upgrade);
      if (u && ws.mass >= action.cost) {
        ws.mass -= action.cost;
        ws.levels[u.name] = (ws.levels[u.name] || 0) + 1;
        ws.consolidation += u.consolidation || 0;
        buyLog.push({
          tick: simTick, time_s: simTick, action: 'buy',
          upgrade: u.name, cost: action.cost, tier: ws.currentTier,
        });
        if (u.completionist) {
          milestones.push({
            tick: simTick, time_s: simTick, kind: 'completionist',
            tier: ws.currentTier, name: u.name,
          });
        }
      }
    } else if (action.action === 'save') {
      // Save mode: no purchase, but record target for buy-log analysis.
      // Suppress repeat save-on-target rows so the buyLog doesn't explode
      // — we want one entry per save target, not one per tick.
      const last = buyLog.length > 0 ? buyLog[buyLog.length - 1] : null;
      if (!(last && last.action === 'save' && last.target === action.target)) {
        buyLog.push({
          tick: simTick, time_s: simTick, action: 'save',
          target: action.target, tier: ws.currentTier,
        });
      }
    }
    // 'none' → no-op; not logged.
  }

  // Safety: if the loop exhausted MAX_OFFLINE_TICKS without break, mark it.
  if (simTick > ticks && ticks >= MAX_OFFLINE_TICKS) {
    endReason = 'max-ticks-exceeded';
  }

  return {
    newState: ws,
    buyLog,
    milestones,
    endReason,
    ticks: Math.min(simTick - 1, ticks),
  };
}
