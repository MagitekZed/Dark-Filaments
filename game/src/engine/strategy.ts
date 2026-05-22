// Dark Filaments — sim strategy
// The algorithmic player's per-tick decision function.
// Pure: input is current state + params + upgrade list; output is a single action descriptor.
// No DOM, no timers, no closure over UI state.
//
// Ported from Simulator/legacy/sim_validate.py (the v1.2.1 strategy, which is itself
// a faithful translation of the legacy spreadsheet's column-AX action formula).
//
// Strategy summary (v1.2.1):
//   1. If consolidation threshold met AND all completionist upgrades maxed → transition.
//   2. Else if any unowned one-shot is affordable → buy the cheapest one.
//   3. Else compute per-stackable VPC (per-level marginal income gain / next cost).
//      In post-consolidation-focus mode (consolidation met, completionists not done),
//      mask non-completionist stackables out of the affordable pool.
//   4. Compute next-target VPC (max VPC across unowned-and-unaffordable upgrades,
//      including stackables when unaffordable, and one-shots' bespoke VPC formulas).
//   5. If nextTargetVPC > saveVpcThreshold × maxAffordableStackableVPC → save mode.
//   6. Otherwise buy the affordable stackable with max VPC.
//
// TS port (scaffold plan §5.1): IIFE wrapper + UMD shim stripped; the JS body and
// every numeric literal preserved. strategy is self-contained (it redeclares its
// own selfContrib/synergyMult to stay independent of core load order); no imports
// of other engine modules are needed.
//
// NOTE: T1-specific assumptions baked into the one-shot VPC formulas:
//   - Orbital Resonance is the ×all-MPS one-shot.
//   - Heliopause is the synergy-provider one-shot (target = Stellar Coupling, mult = 1.5).
//   - First Photons is the mixed-effect one-shot (+1.0 base MPS, ×1.20 all-MPC).
// These specific upgrade names appear in the formulas because the legacy script's
// VPC for one-shots is bespoke per effect type. T2 will need its own table.

import type { Upgrade } from './types';

type AnyState = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
type AnyParams = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export interface Classification {
  stackables: string[];
  oneShots: string[];
  completionists: string[];
}

export type Action =
  | { action: 'transition' }
  | { action: 'buy'; upgrade: string; cost: number }
  | { action: 'save'; target: string | null }
  | { action: 'none' };

// Tier-aware indexing helpers.
// For T1, classification is by maxLevels and synergy/effect type:
//   - maxLevels === 1            → one-shot
//   - else                        → stackable
//   - completionist: u.completionist === true
export function classify(upgrades: Upgrade[]): Classification {
  const stackables: string[] = [];
  const oneShots: string[] = [];
  const completionists: string[] = [];
  for (const u of upgrades) {
    if (u.maxLevels === 1) oneShots.push(u.name);
    else stackables.push(u.name);
    if (u.completionist) completionists.push(u.name);
  }
  return { stackables, oneShots, completionists };
}

// Look up an upgrade by name (small-list linear scan; N is tiny).
function find(upgrades: Upgrade[], name: string): Upgrade | null {
  for (const u of upgrades) if (u.name === name) return u;
  return null;
}

// Cost of the next purchase of `upgradeName` given current `levels`. Null if maxed.
function nextCost(upgrade: Upgrade, level: number): number | null {
  if (level >= upgrade.maxLevels) return null;
  return upgrade.initCost * Math.pow(upgrade.costGrowth, level);
}

// self_contrib(N, B, A, S) — same as core.selfContrib, redeclared here to keep
// strategy independent of core load order. Cheap, correct.
// L1 = base (selfMult not yet applied); L2+ apply S^(N-1).
function selfContrib(N: number, B: number, A: number, S: number): number {
  if (N === 0) return 0;
  return (B + N * A) * Math.pow(S, N - 1);
}

// synergyMult(target, levels, upgrades, synergyProviders?) — same semantics as
// core.synergyMult: Π over providers of multiplier^N (default) or 1+(m-1)*N for
// additive-kind synergies. Optional synergyProviders argument widens the provider
// list to include prior-tier owned upgrades for cross-tier synergy support; defaults
// to the active-tier upgrade slice so T1/T2 behavior is byte-identical.
function synergyMult(
  targetName: string,
  levels: Record<string, number>,
  upgrades: Upgrade[],
  synergyProviders?: Upgrade[],
): number {
  const providers = synergyProviders || upgrades;
  let mult = 1;
  for (const u of providers) {
    const N = levels[u.name] || 0;
    if (N === 0 || !u.synergies || u.synergies.length === 0) continue;
    for (const syn of u.synergies) {
      if (syn.target !== targetName) continue;
      if (syn.kind === "additive") {
        mult *= 1 + (syn.multiplier - 1) * N;
      } else {
        mult *= Math.pow(syn.multiplier, N);
      }
    }
  }
  return mult;
}

// Π over upgrades of allMps^N for the requested stat ("mps" | "mpc" | "aps").
function globalMult(stat: string, levels: Record<string, number>, upgrades: Upgrade[]): number {
  const key = stat === "mps" ? "allMps" : stat === "mpc" ? "allMpc" : "allAps";
  let m = 1;
  for (const u of upgrades) {
    const N = levels[u.name] || 0;
    m *= Math.pow((u as unknown as Record<string, number>)[key], N);
  }
  return m;
}

// --- Stackable VPC -------------------------------------------------------
// Marginal per-second income gain from raising this stackable's level by 1,
// divided by the next purchase cost.
//
// Per-level marginal income for a stackable depends on which stat it grows.
// The marginal self-contribution is computed via differencing selfContrib at
// N+1 vs N, which is correct for any (B, A, S) configuration — linear,
// exponential (B>0, S>1), or mixed:
//   - addMps/baseMps×selfMps stackables:
//       delta = ΔselfMps × globalMps × synergyMult(self) × allMps_carry
//   - addMpc/baseMpc×selfMpc stackables:
//       delta = ΔselfMpc × globalMpc × synergyMult(self)
//                        × allMpc_carry × (cpm/60 × engagement + aps)
//   - addAps/baseAps×selfAps stackables:
//       delta = ΔselfAps × globalAps × synergyMult(self) × allAps_carry × mpc
//                        + synergy gift to its target (legacy v1.2.1 quirk)
//
// For the T1 default shape (B=0, A=a, S=1) ΔselfMps collapses to `a`, so this
// is byte-identical to the legacy linear formula. T1 uses only addMps (Solar
// Wind, Asteroid Belt, Magnetosphere) and addMpc (Stellar Coupling). No T1
// stackable provides synergy. Carry-over factors are 1.0 in the no-carry path.
export function stackableVpc(
  name: string,
  state: AnyState,
  params: AnyParams,
  upgrades: Upgrade[],
  _classification?: Classification,
): number {
  const u = find(upgrades, name);
  if (!u) return 0;
  const lvl = state.levels[name] || 0;
  const cost = nextCost(u, lvl);
  if (cost == null || cost <= 0) return 0;

  const cpm = params.cpm;
  const engagement = (params.engagement != null) ? params.engagement : 1.0;
  const carry = params.carry || { allMps: 1.0, allMpc: 1.0, allAps: 1.0 };
  // synergyProviders (optional in params) — wider provider list for cross-tier
  // synergies. Falls back to active-tier upgrades, preserving T1/T2 behavior.
  const synProviders = params.synergyProviders || upgrades;

  const gMps = globalMult("mps", state.levels, upgrades);
  const gMpc = globalMult("mpc", state.levels, upgrades);
  const gAps = globalMult("aps", state.levels, upgrades);
  const synSelf = synergyMult(name, state.levels, upgrades, synProviders);

  // Current MPC / APS for click-driven income computations.
  // Option-C semantic (2026-05-10): carry floors are RAW Σ self·syn (NO allX
  // applied) and the cumulative all-mult (carry × active) re-multiplies the
  // combined floor + active sum live. Mathematically:
  //   mpc_live = (baseMpc + carryMpc + Σ_active self·syn) × carry.allMpc × Π_active(allMpc^N)
  // The same shape applies to MPS/APS. Previously the strategy computed
  // ((baseMpc + Σ_active) × Π_active × carry.allMpc) + carryMpc, which left
  // the carry floor un-multiplied by active-tier allMpc — out of sync with
  // the load-bearing rule. Bringing strategy into line with core.computeRates.
  let mpcSum = 0, mpcMult = 1;
  for (const uu of upgrades) {
    const N = state.levels[uu.name] || 0;
    mpcSum += selfContrib(N, uu.baseMpc, uu.addMpc, uu.selfMpc) * synergyMult(uu.name, state.levels, upgrades, synProviders);
    mpcMult *= Math.pow(uu.allMpc, N);
  }
  const mpc = (params.baseMpc + (params.carryMpc || 0) + mpcSum) * mpcMult * carry.allMpc;

  let apsSum = 0, apsMult = 1;
  for (const uu of upgrades) {
    const N = state.levels[uu.name] || 0;
    apsSum += selfContrib(N, uu.baseAps, uu.addAps, uu.selfAps) * synergyMult(uu.name, state.levels, upgrades, synProviders);
    apsMult *= Math.pow(uu.allAps, N);
  }
  const aps = ((params.carryAps || 0) + apsSum) * apsMult * carry.allAps;

  // Generalized marginal self-contribution per +1 level. Works for any
  // (B, A, S) shape — including B>0/A=0/S>1 exponential configs — by
  // differencing selfContrib at N+1 vs N. For the linear default (S=1, B=0,
  // A=a) this collapses back to `a` so the T1 calibration is byte-identical.
  function marginalSelf(B: number, A: number, S: number): number {
    return selfContrib(lvl + 1, B, A, S) - selfContrib(lvl, B, A, S);
  }

  // Marginal contribution of one *additional* level of this synergy at this
  // provider's current state. For multiplicative synergies the ratio (m^(N+1)/
  // m^N - 1) = m - 1, matching the legacy formulas. For additive synergies it
  // resolves to addPerLvl / (1 + addPerLvl × N) — the marginal kick of "+0.04
  // per level" diminishes as N grows, which is the right read for the gift
  // valuation. (The next-level marginal effect on already-multiplied output.)
  function synMarginal(syn: { kind?: string; multiplier: number }, providerLevel: number): number {
    if (syn.kind === "additive") {
      const a = syn.multiplier - 1;
      const cur = 1 + a * providerLevel;
      return a / cur;
    }
    return syn.multiplier - 1.0;
  }

  // The if/else chain below is exhaustive (terminal else), so delta is always
  // assigned before the `delta === 0` read; declared without a useless 0 init.
  let delta: number;
  if (u.carryMpsMult != null && u.carryMpsMult > 1.0) {
    // Hidden-channel stackable (Subhalo). Multiplies prior-tier MPS carry
    // by α_eff^N where α_eff = α × synergyMult(self). Marginal delta from N
    // to N+1: carryMps × α_eff^N × (α_eff - 1) × allMps_total. Synergies
    // received are baked into α_eff; the strategy values one additional
    // Subhalo level at the income gain on the already-multiplied carry.
    // If carryMps is zero (somehow T3 entered without prior carry), the
    // delta resolves to 0 → VPC = 0 → bot will not buy Subhalo. Acceptable.
    const carryMpsVal = params.carryMps || 0;
    const aEff = u.carryMpsMult * synSelf;
    const factorN = Math.pow(aEff, lvl);
    const deltaFactor = factorN * (aEff - 1);
    delta = carryMpsVal * deltaFactor * gMps * carry.allMps;
  } else if (u.addMpc > 0 || (u.baseMpc > 0 && u.selfMpc !== 1.0)) {
    // Click-based stackable. Marginal income per second from one extra level.
    const dSelf = marginalSelf(u.baseMpc, u.addMpc, u.selfMpc);
    delta = dSelf * gMpc * synSelf * carry.allMpc * (cpm / 60 * engagement + aps);
  } else if (u.addAps > 0 || (u.baseAps > 0 && u.selfAps !== 1.0)) {
    // Auto-click stackable. Self contribution × MPC, plus any synergy gift.
    const dSelf = marginalSelf(u.baseAps, u.addAps, u.selfAps);
    const selfDelta = dSelf * gAps * synSelf * carry.allAps * mpc;
    let synergyGift = 0;
    if (u.synergies && u.synergies.length > 0) {
      for (const syn of u.synergies) {
        const tgt = find(synProviders, syn.target) || find(upgrades, syn.target);
        if (!tgt) continue;
        // Compute target's current per-second contribution to the stat it grows.
        // For T1 there are no addAps stackables with synergy targets, so this
        // path is dormant in T1 — included for T2 correctness.
        const targetLevels = state.levels[tgt.name] || 0;
        const targetSyn = synergyMult(tgt.name, state.levels, upgrades, synProviders);
        const margin = synMarginal(syn, lvl);
        if (tgt.addMps > 0) {
          const tgtCurrent = selfContrib(targetLevels, tgt.baseMps, tgt.addMps, tgt.selfMps)
                           * targetSyn * gMps * carry.allMps;
          synergyGift += tgtCurrent * margin;
        } else if (tgt.addMpc > 0) {
          const tgtCurrent = selfContrib(targetLevels, tgt.baseMpc, tgt.addMpc, tgt.selfMpc)
                           * targetSyn * gMpc * carry.allMpc * (cpm / 60 * engagement + aps);
          synergyGift += tgtCurrent * margin;
        }
      }
    }
    delta = selfDelta + synergyGift;
  } else {
    // Default: passive M/sec stackable (or consolidation-only stackable, see fallback below).
    const dSelf = marginalSelf(u.baseMps, u.addMps, u.selfMps);
    let selfDelta = dSelf * gMps * synSelf * carry.allMps;
    // Synergy gift to target (legacy v1.2.1: providers' VPC includes their gift).
    if (u.synergies && u.synergies.length > 0) {
      for (const syn of u.synergies) {
        const tgt = find(synProviders, syn.target) || find(upgrades, syn.target);
        if (!tgt) continue;
        const targetLevels = state.levels[tgt.name] || 0;
        const targetSyn = synergyMult(tgt.name, state.levels, upgrades, synProviders);
        const margin = synMarginal(syn, lvl);
        if (tgt.addAps > 0) {
          const tgtPerSec = selfContrib(targetLevels, tgt.baseAps, tgt.addAps, tgt.selfAps)
                          * targetSyn * gAps * carry.allAps * mpc;
          selfDelta += tgtPerSec * margin;
        } else if (tgt.addMps > 0) {
          const tgtPerSec = selfContrib(targetLevels, tgt.baseMps, tgt.addMps, tgt.selfMps)
                          * targetSyn * gMps * carry.allMps;
          selfDelta += tgtPerSec * margin;
        } else if (tgt.addMpc > 0) {
          const tgtPerSec = selfContrib(targetLevels, tgt.baseMpc, tgt.addMpc, tgt.selfMpc)
                          * targetSyn * gMpc * carry.allMpc * (cpm / 60 * engagement + aps);
          selfDelta += tgtPerSec * margin;
        }
      }
    }
    delta = selfDelta;
  }

  // Consolidation-only stackable (e.g. T3's Galactic Bulge) — no income effect but
  // consolidation contribution that the transition gate requires. Mirrors the
  // oneShotVpc consolidation-epsilon branch: rank these very low but nonzero so the
  // bot will pick them up when there's nothing higher-VPC affordable. T1/T2
  // have no consolidation-only stackables → fallback never fires there.
  if (delta === 0 && u.consolidation > 0) {
    return 0.0001 / cost;
  }

  return delta / cost;
}

// --- One-shot VPC --------------------------------------------------------
// Bespoke per effect type. Mirrors the legacy script's three flavors at T1:
//   - Orbital Resonance: ×1.25 all M/sec → VPC ≈ 0.25 × MPS / cost
//   - Heliopause: synergy provider (1.5× SC's self-contribution) → VPC ≈ 0.5 × SC_per_sec / cost
//   - First Photons: +1.0 base MPS AND ×1.20 all M/click → VPC ≈ (1.0 × global_mps + 0.20 × click_per_sec) / cost
//
// We dispatch by inspecting the upgrade's data fields rather than name-matching,
// so future tiers' one-shots reuse the same logic as long as their data shape
// matches one of these patterns. T2 introduces additional flavors (e.g. Open
// Cluster's tiny seed VPC) — those will need their own branches; fall back to a
// small epsilon for consolidation-only one-shots.
export function oneShotVpc(name: string, state: AnyState, params: AnyParams, upgrades: Upgrade[]): number {
  const u = find(upgrades, name);
  if (!u) return 0;
  if ((state.levels[name] || 0) > 0) return 0;
  const cost = u.initCost;
  if (cost <= 0) return 0;

  const cpm = params.cpm;
  const engagement = (params.engagement != null) ? params.engagement : 1.0;
  const carry = params.carry || { allMps: 1.0, allMpc: 1.0, allAps: 1.0 };
  const synProviders = params.synergyProviders || upgrades;

  const gMps = globalMult("mps", state.levels, upgrades);
  const gMpc = globalMult("mpc", state.levels, upgrades);

  // Current MPS / MPC / APS — needed for the bespoke one-shot VPC formulas.
  let mpsSum = 0, mpsMult = 1, mpcSum = 0, mpcMult = 1, apsSum = 0, apsMult = 1;
  for (const uu of upgrades) {
    const N = state.levels[uu.name] || 0;
    mpsSum += selfContrib(N, uu.baseMps, uu.addMps, uu.selfMps) * synergyMult(uu.name, state.levels, upgrades, synProviders);
    mpsMult *= Math.pow(uu.allMps, N);
    mpcSum += selfContrib(N, uu.baseMpc, uu.addMpc, uu.selfMpc) * synergyMult(uu.name, state.levels, upgrades, synProviders);
    mpcMult *= Math.pow(uu.allMpc, N);
    apsSum += selfContrib(N, uu.baseAps, uu.addAps, uu.selfAps) * synergyMult(uu.name, state.levels, upgrades, synProviders);
    apsMult *= Math.pow(uu.allAps, N);
  }
  // Option-C semantic: see stackableVpc above. Carry floors are RAW Σ self·syn
  // (no allX applied) and the cumulative all-mult re-multiplies the combined
  // floor + active sum live.
  const mps = ((params.carryMps || 0) + mpsSum) * mpsMult * carry.allMps;
  const mpc = (params.baseMpc + (params.carryMpc || 0) + mpcSum) * mpcMult * carry.allMpc;
  const aps = ((params.carryAps || 0) + apsSum) * apsMult * carry.allAps;

  let value = 0;

  // Component A: pure ×all M/sec multiplier (e.g. OR ×1.25 → 0.25 × current MPS gain).
  if (u.allMps !== 1.0) {
    value += (u.allMps - 1.0) * mps;
  }

  // Component B: ×all M/click multiplier (e.g. FP ×1.20 → 0.20 × click income/s gain).
  if (u.allMpc !== 1.0) {
    value += (u.allMpc - 1.0) * mpc * (cpm / 60 * engagement + aps);
  }

  // Component C: base M/sec floor (e.g. FP +1.0 base MPS → 1.0 × globalMps × allMpsCarry).
  if (u.baseMps > 0) {
    value += u.baseMps * gMps * carry.allMps;
  }

  // Component D: base M/click floor.
  if (u.baseMpc > 0) {
    value += u.baseMpc * gMpc * carry.allMpc * (cpm / 60 * engagement + aps);
  }

  // Component E: synergy provider one-shots (e.g. HP → SC ×1.5).
  // For each synergy declared by this one-shot, contribute (mult - 1) × target's
  // current per-second contribution to its growing stat. One-shot providers fire
  // exactly once when bought — for additive synergies the kick is also (m-1)×1.
  if (u.synergies && u.synergies.length > 0) {
    for (const syn of u.synergies) {
      const tgt = find(synProviders, syn.target) || find(upgrades, syn.target);
      if (!tgt) continue;
      const targetLevels = state.levels[tgt.name] || 0;
      const targetSyn = synergyMult(tgt.name, state.levels, upgrades, synProviders);
      const margin = (syn.multiplier - 1.0); // one-shot: provider goes 0→1 either way
      if (tgt.addMpc > 0) {
        const tgtPerSec = selfContrib(targetLevels, tgt.baseMpc, tgt.addMpc, tgt.selfMpc)
                        * targetSyn * gMpc * carry.allMpc * (cpm / 60 * engagement + aps);
        value += margin * tgtPerSec;
      } else if (tgt.addMps > 0) {
        const tgtPerSec = selfContrib(targetLevels, tgt.baseMps, tgt.addMps, tgt.selfMps)
                        * targetSyn * gMps * carry.allMps;
        value += margin * tgtPerSec;
      } else if (tgt.addAps > 0) {
        const tgtPerSec = selfContrib(targetLevels, tgt.baseAps, tgt.addAps, tgt.selfAps)
                        * targetSyn * mpc;
        value += margin * tgtPerSec;
      }
    }
  }

  // Consolidation-only one-shots (e.g. T2's Open Cluster) carry no income effect
  // but do carry consolidation contribution that the transition gate requires.
  // Without a positive VPC the strategy will never rank them — they would
  // strand. The legacy v1.2.1 spreadsheet handled this with a tiny epsilon
  // VPC of 0.0001 / cost, ranking them very low but nonzero. Apply the same
  // here when value is still 0 AND the upgrade has consolidation contribution.
  if (value === 0 && u.consolidation > 0) {
    return 0.0001 / cost;
  }

  return value / cost;
}

// --- Main decision function ---------------------------------------------
// decideAction(state, params, upgrades) → action descriptor.
// Possible returns:
//   { action: "transition" }
//   { action: "buy",  upgrade, cost }
//   { action: "save", target }     // target is the upgrade name we're saving toward
//   { action: "none" }
//
// state shape: { mass, levels: { [upgradeName]: number }, consolidation, ... }
// params shape: { cpm, engagement, saveVpcThreshold, consolidationThreshold, baseMpc, ... }
export function decideAction(state: AnyState, params: AnyParams, upgrades: Upgrade[]): Action {
  const cl = classify(upgrades);
  const consolidationThreshold = params.consolidationThreshold;
  // Floating-point tolerance: tiered-consolidation accumulation (e.g. T3 Bulge
  // 7×0.30 + 0.90 + 3.25) sums to 6.249999999999999 in IEEE 754. Same
  // tolerance as runner.js exit checks; well below any design granularity.
  const CONSOLIDATION_EPS = 1e-9;
  const consolidationMet = state.consolidation + CONSOLIDATION_EPS >= consolidationThreshold;

  // Threshold-mode strategy override (params.mode === "threshold"): the
  // runner exits at the moment consolidation is met, so completionist purchases
  // aren't strategically rational — skip them. T1/T2 didn't need this because
  // completionist costs were small relative to the path; the runner's mode-
  // exit fired before the bot could buy them. T3+ income scales make
  // completionist one-shots trivially affordable mid-path, so without this
  // gate the bot routinely buys completionist GC and HVC in Threshold mode.
  // Mode is read from params.mode (legacy callers omit it → completion-style
  // behavior preserved). We mask completionist-tagged upgrades out of the
  // affordable-one-shot list and the affordable stackable VPC pool.
  const mode = params.mode || "completion";
  const isThresholdMode = (mode === "threshold");

  // 1. Transition condition — consolidation met AND all completionists maxed.
  // In Threshold mode, completionists are never required (the runner exits
  // on consolidation alone). Treat the completionist gate as satisfied.
  const allCompletionistDone = isThresholdMode || cl.completionists.every(name => {
    const u = find(upgrades, name);
    return (state.levels[name] || 0) >= (u as Upgrade).maxLevels;
  });
  if (consolidationMet && allCompletionistDone) {
    return { action: "transition" };
  }

  // Pre-compute costs.
  const costs: Record<string, number | null> = {};
  for (const u of upgrades) {
    costs[u.name] = nextCost(u, state.levels[u.name] || 0);
  }

  // 2. Cheapest affordable unowned one-shot.
  // Threshold mode: skip completionist-tagged one-shots entirely.
  const affordableOneShots: Array<{ name: string; cost: number }> = [];
  for (const name of cl.oneShots) {
    if ((state.levels[name] || 0) > 0) continue;
    if (isThresholdMode) {
      const u = find(upgrades, name);
      if (u && u.completionist) continue;
    }
    const c = costs[name];
    if (c == null) continue;
    if (c <= state.mass) affordableOneShots.push({ name, cost: c });
  }
  if (affordableOneShots.length > 0) {
    affordableOneShots.sort((a, b) => a.cost - b.cost);
    const pick = affordableOneShots[0];
    return { action: "buy", upgrade: pick.name, cost: pick.cost };
  }

  // 2b. Tiered-consolidation stackables (e.g. T3 Galactic Bulge): consolidation-bearing
  // stackable upgrades must be advanced through their levels to clear the
  // tier transition gate. Their consolidation contribution is what gates the tier,
  // and the design intent is that they are *primarily* progress purchases —
  // any income they grant is a side benefit, not a strategic factor. Mirrors
  // the one-shot buy rule:
  //   - upgrade is a stackable (maxLevels > 1)
  //   - consolidation contribution > 0
  //   - not yet maxed and affordable now
  // Buy the cheapest affordable consolidation-bearing stackable level. T1/T2 have
  // no consolidation-bearing stackables, so this branch never fires there
  // (T1/T2 byte-identical preserved). When consolidation is already met AND the
  // upgrade is beyond what's needed, the bot continues to buy out anyway —
  // the design intent for Bulge is "Threshold and Completion both buy all
  // 7 levels".
  //
  // Note: prior to the 2026-05-10 GB-income retune, this branch also
  // excluded consolidation-bearing stackables with any income effect (the
  // `hasIncome` guard, since removed). With income on Galactic Bulge that
  // exclusion routed GB through normal VPC, where its steep cost growth
  // (1.55) made the bot defer it indefinitely in favor of DLD/HII —
  // collapsing the Completion-vs-Threshold inversion gap. The design
  // intent ("Bulge is primarily a progress purchase, income makes it feel
  // substantive but doesn't change the consolidation-drip mechanic") is now
  // mechanically enforced regardless of income presence.
  const consolidationStackables: Array<{ name: string; cost: number }> = [];
  for (const name of cl.stackables) {
    const u = find(upgrades, name);
    if (!u || u.consolidation <= 0) continue;
    const lvl = state.levels[name] || 0;
    if (lvl >= u.maxLevels) continue;
    const c = costs[name];
    if (c == null) continue;
    if (c <= state.mass) consolidationStackables.push({ name, cost: c });
  }
  if (consolidationStackables.length > 0) {
    consolidationStackables.sort((a, b) => a.cost - b.cost);
    const pick = consolidationStackables[0];
    return { action: "buy", upgrade: pick.name, cost: pick.cost };
  }

  // 3. Stackable VPCs (full set; we filter affordable below).
  const vpcs: Record<string, number> = {};
  for (const name of cl.stackables) {
    vpcs[name] = stackableVpc(name, state, params, upgrades, cl);
  }

  // Post-consolidation focus: consolidation met but completionists not done.
  // Originally this fully masked non-completionist stackables out of the
  // affordable pool — calibrated against T1's small Mag wall (~2480 mass
  // total) where the completionist save is short. At T2 the BD wall is
  // ~145k and the full mask creates a long dead-zone where the bot only
  // saves and never improves MPS during the save. Real-player evidence
  // (the 39:05 stackable flurry in T2 playtest #1) shows players DO
  // interleave high-VPC stackables during long completionist saves.
  //
  // Softening (marginal-save-time tolerance, gated on long saves only):
  //   Step 1: Decide if the bot is in a "long save" — saveTimeNow >
  //           longSaveTimeThresholdSec (default 90s).
  //   Step 2: For non-completionist stackables, compute marginal-save-
  //           time impact:
  //             - timeNow = need / income
  //             - timeAfter = (need + cost) / (income + dIncome)
  //   Step 3: If long save AND timeAfter ≤ tolerance × timeNow, unmask
  //           the stackable (full VPC) — it meaningfully helps the
  //           save (or at most slightly delays it within tolerance).
  //           Else hard-mask.
  //
  // T1 saves are <60s and never trigger long-save mode → mask stays
  // hard → T1 byte-identical (PASS / PASS / FAIL at -9.7%).
  const postConsFocus = consolidationMet && !allCompletionistDone;

  // Compute current per-second income for the marginal check.
  // (Mirrors runner's tick income computation but without the engagement
  // override; we use cpm/60 × engagement consistent with the strategy's
  // own VPC math above.)
  function currentIncomePerSec(): number {
    const carry = params.carry || { allMps: 1.0, allMpc: 1.0, allAps: 1.0 };
    const cpm = params.cpm;
    const engagement = (params.engagement != null) ? params.engagement : 1.0;
    const synProviders = params.synergyProviders || upgrades;
    let mpsSum = 0, mpsMult = 1, mpcSum = 0, mpcMult = 1, apsSum = 0, apsMult = 1;
    for (const uu of upgrades) {
      const N = state.levels[uu.name] || 0;
      mpsSum += selfContrib(N, uu.baseMps, uu.addMps, uu.selfMps) * synergyMult(uu.name, state.levels, upgrades, synProviders);
      mpsMult *= Math.pow(uu.allMps, N);
      mpcSum += selfContrib(N, uu.baseMpc, uu.addMpc, uu.selfMpc) * synergyMult(uu.name, state.levels, upgrades, synProviders);
      mpcMult *= Math.pow(uu.allMpc, N);
      apsSum += selfContrib(N, uu.baseAps, uu.addAps, uu.selfAps) * synergyMult(uu.name, state.levels, upgrades, synProviders);
      apsMult *= Math.pow(uu.allAps, N);
    }
    // Option-C semantic: carry floors are RAW Σ self·syn, re-multiplied by
    // the cumulative all-mult product (carry × active) at compute time.
    const mps = ((params.carryMps || 0) + mpsSum) * mpsMult * carry.allMps;
    const mpc = ((params.baseMpc || 0) + (params.carryMpc || 0) + mpcSum) * mpcMult * carry.allMpc;
    const aps = ((params.carryAps || 0) + apsSum) * apsMult * carry.allAps;
    return mps + mpc * cpm / 60 * engagement + aps * mpc;
  }

  // Find the cheapest unmaxed completionist target cost (stackable next-
  // level cost or one-shot init cost, whichever is smallest among
  // unowned completionists). Returns null if none.
  function nextCompletionistCost(): number | null {
    let best: number | null = null;
    for (const name of cl.completionists) {
      const u = find(upgrades, name);
      const lvl = state.levels[name] || 0;
      if (lvl >= (u as Upgrade).maxLevels) continue;
      const c = nextCost(u as Upgrade, lvl);
      if (c == null) continue;
      if (best == null || c < best) best = c;
    }
    return best;
  }

  let saveIncome = 0, saveTargetCost = 0, saveTimeNow = Infinity;
  if (postConsFocus) {
    saveIncome = currentIncomePerSec();
    const tgtCost = nextCompletionistCost();
    if (tgtCost != null) {
      saveTargetCost = tgtCost;
      const need = Math.max(0, saveTargetCost - state.mass);
      saveTimeNow = saveIncome > 0 ? need / saveIncome : Infinity;
    }
  }

  // Long-save dead-zone parameters. See the comment block on the
  // post-consolidation focus block above for the full softening logic.
  //   - longSaveTimeThresholdSec: projected save-time above which the
  //     bot is in a "long save" and the soft-tolerance check fires.
  //     Default 90s — T1 saves never exceed this; T2 BD-3/4/5 saves
  //     comfortably do.
  //   - longSaveTolerance: factor by which timeAfter may exceed timeNow
  //     and still permit the buy. 1.0 would be strict marginal-save-time
  //     win; 1.05 lets buys through that delay the save by up to 5%.
  //     Default 1.05 — small enough to keep completion-time bounded,
  //     generous enough to break T2's dead-zone.
  const longSaveTimeThresholdSec = (params.longSaveTimeThresholdSec != null)
    ? params.longSaveTimeThresholdSec : 90;
  const longSaveTolerance = (params.longSaveTolerance != null)
    ? params.longSaveTolerance : 1.05;

  const isLongSave = (saveTimeNow > longSaveTimeThresholdSec);

  const affVpcs: Record<string, number> = {};
  for (const name of cl.stackables) {
    const c = costs[name];
    if (c == null || c > state.mass) { affVpcs[name] = 0; continue; }
    // Threshold mode: completionist stackables are off the table.
    if (isThresholdMode) {
      const u = find(upgrades, name);
      if (u && u.completionist) { affVpcs[name] = 0; continue; }
    }
    if (postConsFocus && !(find(upgrades, name) as Upgrade).completionist) {
      if (!isLongSave) {
        // Short save → hard mask (T1 byte-identical path).
        affVpcs[name] = 0;
        continue;
      }
      // Long save → marginal-save-time tolerance check.
      if (saveTargetCost <= 0 || saveIncome <= 0) { affVpcs[name] = 0; continue; }
      // Marginal income gain from one more level of this stackable.
      // (vpcs[name] = delta / cost, so delta = vpcs[name] × cost.)
      const dIncome = vpcs[name] * c;
      const need = Math.max(0, saveTargetCost - state.mass);
      const newIncome = saveIncome + dIncome;
      const timeAfter = newIncome > 0 ? (need + c) / newIncome : Infinity;
      if (timeAfter <= longSaveTolerance * saveTimeNow) {
        affVpcs[name] = vpcs[name];
      } else {
        affVpcs[name] = 0;
      }
      continue;
    }
    affVpcs[name] = vpcs[name];
  }

  let maxAffVpc = 0;
  let bestAffName: string | null = null;
  for (const name of cl.stackables) {
    if (affVpcs[name] > maxAffVpc) {
      maxAffVpc = affVpcs[name];
      bestAffName = name;
    }
  }

  // 4. Next-target VPC — max VPC across unowned-and-unaffordable upgrades.
  // Includes:
  //   - Unaffordable one-shots, valued by their bespoke one-shot VPC formula.
  //   - Unaffordable stackables, valued by their stackable VPC.
  // Threshold mode: skip completionists (they are not on the path).
  let nextTargetVpc = 0;
  let nextTargetName: string | null = null;
  for (const name of cl.oneShots) {
    if ((state.levels[name] || 0) > 0) continue;
    if (isThresholdMode) {
      const u = find(upgrades, name);
      if (u && u.completionist) continue;
    }
    // Unaffordable one-shots only — affordable ones would have been bought above.
    const c = costs[name];
    if (c == null || c <= state.mass) continue;
    const v = oneShotVpc(name, state, params, upgrades);
    if (v > nextTargetVpc) { nextTargetVpc = v; nextTargetName = name; }
  }
  for (const name of cl.stackables) {
    if (isThresholdMode) {
      const u = find(upgrades, name);
      if (u && u.completionist) continue;
    }
    const c = costs[name];
    if (c == null || c <= state.mass) continue;
    const v = vpcs[name];
    if (v > nextTargetVpc) { nextTargetVpc = v; nextTargetName = name; }
  }

  // 5. Save mode.
  const saveThreshold = params.saveVpcThreshold;
  if (nextTargetVpc > saveThreshold * maxAffVpc) {
    return { action: "save", target: nextTargetName };
  }

  // 6. Buy the affordable stackable with max VPC.
  if (bestAffName != null && maxAffVpc > 0) {
    return { action: "buy", upgrade: bestAffName, cost: costs[bestAffName] as number };
  }

  return { action: "none" };
}
