// Dark Filaments — Subhalo hidden-channel parity test (Vitest port).
//
// Ported from Prototype/src/test/validate_subhalo.js (scaffold plan §5.2),
// byte-identical assertion values. The prototype's require('../sim/X.js')
// side-effect loads are replaced with engine imports. Each original check is
// collected by the same check() accumulator, then surfaced as a Vitest test;
// a final test asserts the count == 28 (the locked spec count, unchanged).
//
// Step C verification: must run green after every change to core.computeRates,
// strategy.stackableVpc, or the Subhalo data.ts entry.
//
// Asserts:
//   1. Identity (0 Subhalo levels): mps is byte-identical to the legacy formula.
//   2. L1 / L2 / L3 Subhalo, no synergies: factor scales α / α^2 / α^3, applied
//      to carryMps only (not sumMps).
//   3. Population II synergy compounds the per-level coefficient pre-exponentiation.
//   4. Brown Dwarf cross-tier synergy compounds the per-level coefficient.
//   5. B + C synergies compound multiplicatively into α_eff_per_level.
//   6. Hidden factor persists through tier transition.
//   7. Subhalo's per-upgrade row contribution is zero on every stat.
//   8. Offline accrual integrates the hidden factor correctly (parity vs runner).
//   9. Edge: carryMps=0 → hidden factor multiplies zero → no effect.
//  10. No-op when no upgrade declares carryMpsMult.
//  11. Purity: computeRates does not mutate state.
//  12. Strategy VPC parity: stackableVpc returns the expected delta.
//
// Tolerance: <= 1e-9 for analytic identities; <= 0.1% on offline parity.

import { describe, it, expect } from 'vitest';
import * as core from '../../engine/core';
import * as strategy from '../../engine/strategy';
import { reconstructFromOfflineWindow } from '../../engine/offline';
import { UPGRADES } from '../../engine/data';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

interface CheckResult { name: string; ok: boolean; detail: string }
const RESULTS: CheckResult[] = [];
function check(name: string, ok: boolean, detail?: string): void {
  RESULTS.push({ name, ok: !!ok, detail: detail || '' });
}

function approx(a: number, b: number, tol?: number): boolean {
  const t = tol == null ? 1e-9 : tol;
  if (a === b) return true;
  const denom = Math.max(Math.abs(a), Math.abs(b), 1);
  return Math.abs(a - b) / denom <= t;
}

// Locate the canonical upgrade entries we test against.
const SUBHALO = UPGRADES.find(u => u.name === 'Subhalo' && u.tier === 3) as Any;
const POP_II  = UPGRADES.find(u => u.name === 'Population II' && u.tier === 3) as Any;
const BD      = UPGRADES.find(u => u.name === 'Brown Dwarf' && u.tier === 2) as Any;
const T3_UPGRADES = UPGRADES.filter(u => (u.tier == null ? 1 : u.tier) === 3);

// Precondition: Subhalo entry is the carryMpsMult shape we expect.
check('precondition: Subhalo defines carryMpsMult > 1',
  SUBHALO && SUBHALO.carryMpsMult != null && SUBHALO.carryMpsMult > 1.0,
  'carryMpsMult=' + (SUBHALO && SUBHALO.carryMpsMult));
check('precondition: Subhalo declares zero MPS/MPC/APS contribution',
  SUBHALO && SUBHALO.baseMps === 0 && SUBHALO.addMps === 0 && SUBHALO.selfMps === 1.0
    && SUBHALO.baseMpc === 0 && SUBHALO.addMpc === 0 && SUBHALO.selfMpc === 1.0
    && SUBHALO.baseAps === 0 && SUBHALO.addAps === 0 && SUBHALO.selfAps === 1.0
    && SUBHALO.allMps === 1.0 && SUBHALO.allMpc === 1.0 && SUBHALO.allAps === 1.0);
check('precondition: Population II declares additive Subhalo synergy',
  POP_II && POP_II.synergies && POP_II.synergies.some((s: Any) =>
    s.target === 'Subhalo' && s.kind === 'additive' && s.multiplier > 1.0));
check('precondition: Brown Dwarf declares additive Subhalo synergy (cross-tier)',
  BD && BD.synergies && BD.synergies.some((s: Any) =>
    s.target === 'Subhalo' && s.kind === 'additive' && s.multiplier > 1.0));

const ALPHA = SUBHALO.carryMpsMult;
const BETA_B = POP_II.synergies.find((s: Any) => s.target === 'Subhalo').multiplier - 1;
const BETA_C = BD.synergies.find((s: Any) => s.target === 'Subhalo').multiplier - 1;

function makeState(subhaloLvl: number, popIILvl: number, bdLvl: number): Any {
  const levels = Object.fromEntries(UPGRADES.map(u => [u.name, 0]));
  if (subhaloLvl) levels['Subhalo'] = subhaloLvl;
  if (popIILvl)   levels['Population II'] = popIILvl;
  if (bdLvl)      levels['Brown Dwarf'] = bdLvl;
  return { mass: 0, consolidation: 0, levels };
}

const CARRY = { allMps: 1.0, allMpc: 1.0, allAps: 1.0, carryMps: 100, carryMpc: 0, carryAps: 0 };
const PARAMS = { baseMpc: 0.0012 };

// 1. Identity case.
{
  const s = makeState(0, 0, 0);
  const r = core.computeRates(s, T3_UPGRADES, CARRY, PARAMS, UPGRADES);
  check('identity: 0 Subhalo levels -> hidden factor 1.0 (mps=' + r.mps + ')',
    approx(r.mps, 100));
}

// 2. Subhalo L1/L2/L3, no synergies.
{
  for (const N of [1, 2, 3]) {
    const s = makeState(N, 0, 0);
    const r = core.computeRates(s, T3_UPGRADES, CARRY, PARAMS, UPGRADES);
    const expected = 100 * Math.pow(ALPHA, N);
    check('no-synergy: L' + N + ' Subhalo -> mps = carryMps × α^' + N
          + ' (got=' + r.mps.toFixed(6) + ', expected=' + expected.toFixed(6) + ')',
      approx(r.mps, expected));
  }
}

// 3. L1 Subhalo + Synergy B (Population II = 5).
{
  const sWithout = makeState(0, 5, 0);
  const sWith    = makeState(1, 5, 0);
  const rWo = core.computeRates(sWithout, T3_UPGRADES, CARRY, PARAMS, UPGRADES);
  const rW  = core.computeRates(sWith,    T3_UPGRADES, CARRY, PARAMS, UPGRADES);
  const aEff = ALPHA * (1 + 5 * BETA_B);
  const expectedDelta = 100 * (Math.pow(aEff, 1) - 1);
  const actualDelta = rW.mps - rWo.mps;
  check('synergy-B: L1 Subhalo + 5 PopII -> hidden factor α × (1 + 5β_B) '
        + '(delta got=' + actualDelta.toFixed(6) + ', expected=' + expectedDelta.toFixed(6) + ')',
    approx(actualDelta, expectedDelta, 1e-9));
}

// 4. L2 Subhalo + Synergy C (Brown Dwarf).
{
  const BD_LEVEL = Math.min(10, BD.maxLevels);
  const sWithout = makeState(0, 0, BD_LEVEL);
  const sWith    = makeState(2, 0, BD_LEVEL);
  const rWo = core.computeRates(sWithout, T3_UPGRADES, CARRY, PARAMS, UPGRADES);
  const rW  = core.computeRates(sWith,    T3_UPGRADES, CARRY, PARAMS, UPGRADES);
  const aEff = ALPHA * (1 + BD_LEVEL * BETA_C);
  const expectedDelta = 100 * (Math.pow(aEff, 2) - 1);
  const actualDelta = rW.mps - rWo.mps;
  check('synergy-C: L2 Subhalo + ' + BD_LEVEL + ' BD -> hidden factor α × (1 + ' + BD_LEVEL + 'β_C) '
        + '(delta got=' + actualDelta.toFixed(6) + ', expected=' + expectedDelta.toFixed(6) + ')',
    approx(actualDelta, expectedDelta, 1e-9));
}

// 5. L3 Subhalo + B + C together.
{
  const BD_LEVEL = Math.min(10, BD.maxLevels);
  const sWithout = makeState(0, 7, BD_LEVEL);
  const sWith    = makeState(3, 7, BD_LEVEL);
  const rWo = core.computeRates(sWithout, T3_UPGRADES, CARRY, PARAMS, UPGRADES);
  const rW  = core.computeRates(sWith,    T3_UPGRADES, CARRY, PARAMS, UPGRADES);
  const aEff = ALPHA * (1 + 7 * BETA_B) * (1 + BD_LEVEL * BETA_C);
  const expectedDelta = 100 * (Math.pow(aEff, 3) - 1);
  const actualDelta = rW.mps - rWo.mps;
  check('synergy-B+C: L3 Subhalo + 7 PopII + ' + BD_LEVEL + ' BD -> factor compounds correctly '
        + '(delta got=' + actualDelta.toFixed(6) + ', expected=' + expectedDelta.toFixed(6) + ')',
    approx(actualDelta, expectedDelta, 1e-9));
}

// 6. T3 → T4 transition: Subhalo owned at L2 must continue amplifying carryMps.
{
  const T4_UPGRADES = UPGRADES.filter(u => (u.tier == null ? 1 : u.tier) === 4);
  const levels = Object.fromEntries(UPGRADES.map(u => [u.name, 0]));
  levels['Subhalo'] = 2;
  const sWith    = { mass: 0, consolidation: 0, levels };
  const sWithout = { mass: 0, consolidation: 0, levels: Object.assign({}, levels, { Subhalo: 0 }) };
  const carry = { allMps: 1.5, allMpc: 1.0, allAps: 1.0, carryMps: 200, carryMpc: 0, carryAps: 0 };
  const rWo = core.computeRates(sWithout, T4_UPGRADES, carry, PARAMS, UPGRADES);
  const rW  = core.computeRates(sWith,    T4_UPGRADES, carry, PARAMS, UPGRADES);
  const expectedDelta = 200 * (Math.pow(ALPHA, 2) - 1) * 1.5; // × allMpsCarry
  const actualDelta = rW.mps - rWo.mps;
  check('transition: Subhalo L2 still applies at T4 (delta got=' + actualDelta.toFixed(6)
        + ', expected=' + expectedDelta.toFixed(6) + ')',
    approx(actualDelta, expectedDelta, 1e-9));
}

// 7. Stat-display contract: Subhalo's per-upgrade row is zero across MPS/MPC/APS.
{
  const N = 5;
  const selfMps = core.selfContrib(N, SUBHALO.baseMps, SUBHALO.addMps, SUBHALO.selfMps);
  const selfMpc = core.selfContrib(N, SUBHALO.baseMpc, SUBHALO.addMpc, SUBHALO.selfMpc);
  const selfAps = core.selfContrib(N, SUBHALO.baseAps, SUBHALO.addAps, SUBHALO.selfAps);
  check('stat-display: Subhalo selfMps row = 0 at L' + N, selfMps === 0, 'got ' + selfMps);
  check('stat-display: Subhalo selfMpc row = 0 at L' + N, selfMpc === 0, 'got ' + selfMpc);
  check('stat-display: Subhalo selfAps row = 0 at L' + N, selfAps === 0, 'got ' + selfAps);
}

// 8. Offline-accrual integration.
{
  const seed: Any = {
    mass: 0, consolidation: 0, currentTier: 3,
    levels: Object.fromEntries(UPGRADES.map(u => [u.name, 0])),
    carry: { allMps: 1.0, allMpc: 1.0, allAps: 1.0, carryMps: 50, carryMpc: 0, carryAps: 0 },
    consolidationThreshold: 6.25, consolidationHitMs: null,
    totalClicks: 0, sessionStart: 0, totalPausedMs: 0,
    massGainedClicks: 0, massGainedPassive: 0, massGainedAuto: 0,
    tickCount: 0,
    tierSnapshots: [{ tier: 3, startMs: 0, thresholdHitMs: null, endMs: null,
                     levelsAtEnd: null, massAtEnd: null, consolidationHitMs: null }],
  };
  seed.levels['Subhalo'] = 2;
  const result = reconstructFromOfflineWindow(seed, 60, { cpm: 0, allowPurchases: false });
  const expectedMps = 50 * Math.pow(ALPHA, 2);
  const expectedDelta = expectedMps * 60;
  const actualDelta = result.newState.mass;
  check('offline: Subhalo L2 hidden factor applies in pure-idle (got=' + actualDelta.toFixed(6)
        + ', expected=' + expectedDelta.toFixed(6) + ')',
    approx(actualDelta, expectedDelta, 1e-6));
  check('offline: Subhalo L2 NOT raw carry (raw=' + (50 * 60) + ', actual=' + actualDelta.toFixed(6) + ')',
    actualDelta > 50 * 60 + 1e-6);
}

// 9. Edge: carryMps = 0.
{
  const carry0 = { allMps: 1.0, allMpc: 1.0, allAps: 1.0, carryMps: 0, carryMpc: 0, carryAps: 0 };
  const sWithout = makeState(0, 0, 0);
  const sWith    = makeState(5, 0, 0);
  const rWo = core.computeRates(sWithout, T3_UPGRADES, carry0, PARAMS, UPGRADES);
  const rW  = core.computeRates(sWith,    T3_UPGRADES, carry0, PARAMS, UPGRADES);
  check('edge: carryMps=0 -> Subhalo L5 changes nothing (rWo=' + rWo.mps.toFixed(6)
        + ', rW=' + rW.mps.toFixed(6) + ')',
    approx(rWo.mps, rW.mps, 1e-12));
}

// 10. No-op when no upgrade declares carryMpsMult.
{
  const T1 = UPGRADES.filter(u => (u.tier == null ? 1 : u.tier) === 1);
  const t1Has = T1.some(u => u.carryMpsMult != null);
  check('no-op: T1 upgrades declare no carryMpsMult', !t1Has);
  const levels = Object.fromEntries(UPGRADES.map(u => [u.name, 0]));
  levels['Solar Wind'] = 10;
  levels['Asteroid Belt'] = 8;
  const s = { mass: 0, consolidation: 0, levels };
  const carry = { allMps: 1.0, allMpc: 1.0, allAps: 1.0, carryMps: 0, carryMpc: 0, carryAps: 0 };
  const r = core.computeRates(s, T1, carry, PARAMS, T1);
  const legacy = core.computeMps(s, T1, T1);
  check('no-op: T1 computeRates.mps matches computeMps (rates=' + r.mps.toFixed(6)
        + ', legacy=' + legacy.toFixed(6) + ')',
    approx(r.mps, legacy, 1e-12));
}

// 11. Purity.
{
  const s = makeState(3, 5, 4);
  const snapshot = JSON.stringify(s);
  core.computeRates(s, T3_UPGRADES, CARRY, PARAMS, UPGRADES);
  check('purity: state.levels not mutated', JSON.stringify(s) === snapshot);
  const r1 = core.computeRates(s, T3_UPGRADES, CARRY, PARAMS, UPGRADES);
  const r2 = core.computeRates(s, T3_UPGRADES, CARRY, PARAMS, UPGRADES);
  check('purity: deterministic mps', r1.mps === r2.mps);
  check('purity: deterministic mpc', r1.mpc === r2.mpc);
  check('purity: deterministic aps', r1.aps === r2.aps);
}

// 12. Strategy VPC parity.
{
  const s = makeState(2, 0, 0);
  const params = {
    cpm: 100, engagement: 1.0,
    baseMpc: PARAMS.baseMpc,
    carry: { allMps: 1.0, allMpc: 1.0, allAps: 1.0 },
    carryMps: 100, carryMpc: 0, carryAps: 0,
    synergyProviders: UPGRADES,
  };
  const vpc = strategy.stackableVpc('Subhalo', s, params, T3_UPGRADES);
  const aEff = ALPHA;
  const deltaFactor = Math.pow(aEff, 2) * (aEff - 1);
  const expectedDelta = 100 * deltaFactor;
  const nextC = SUBHALO.initCost * Math.pow(SUBHALO.costGrowth, 2);
  const expectedVpc = expectedDelta / nextC;
  check('strategy: Subhalo VPC at L2 matches expected delta/cost (vpc=' + vpc.toExponential(4)
        + ', expected=' + expectedVpc.toExponential(4) + ')',
    approx(vpc, expectedVpc, 1e-9));
  check('strategy: Subhalo VPC > 0 (strategy will consider buying)', vpc > 0);
}

// VPC with synergies present.
{
  const s = makeState(1, 5, 4);
  const params = {
    cpm: 100, engagement: 1.0,
    baseMpc: PARAMS.baseMpc,
    carry: { allMps: 1.0, allMpc: 1.0, allAps: 1.0 },
    carryMps: 500, carryMpc: 0, carryAps: 0,
    synergyProviders: UPGRADES,
  };
  const vpc = strategy.stackableVpc('Subhalo', s, params, T3_UPGRADES);
  const aEff = ALPHA * (1 + 5 * BETA_B) * (1 + 4 * BETA_C);
  const deltaFactor = Math.pow(aEff, 1) * (aEff - 1);
  const expectedDelta = 500 * deltaFactor;
  const nextC = SUBHALO.initCost * Math.pow(SUBHALO.costGrowth, 1);
  const expectedVpc = expectedDelta / nextC;
  check('strategy: Subhalo VPC at L1 + B + C synergies (vpc=' + vpc.toExponential(4)
        + ', expected=' + expectedVpc.toExponential(4) + ')',
    approx(vpc, expectedVpc, 1e-9));
}

// VPC with carryMps=0.
{
  const s = makeState(2, 0, 0);
  const params = {
    cpm: 100, engagement: 1.0,
    baseMpc: PARAMS.baseMpc,
    carry: { allMps: 1.0, allMpc: 1.0, allAps: 1.0 },
    carryMps: 0, carryMpc: 0, carryAps: 0,
    synergyProviders: UPGRADES,
  };
  const vpc = strategy.stackableVpc('Subhalo', s, params, T3_UPGRADES);
  check('strategy: Subhalo VPC at carryMps=0 returns 0', vpc === 0, 'got ' + vpc);
}

// -----------------------------------------------------------------------
// Surface every collected check as a Vitest test + assert the locked count.
// -----------------------------------------------------------------------
describe('validate_subhalo (ported, locked count 28)', () => {
  it('runs exactly 28 checks (locked spec count, unchanged from prototype)', () => {
    expect(RESULTS.length).toBe(28);
  });
  it.each(RESULTS.map((r, i) => [i, r] as const))('%i: %o', (_i, r) => {
    expect(r.ok, r.name + (r.detail ? '  — ' + r.detail : '')).toBe(true);
  });
});
