// Dark Filaments — offline-math parity test (Vitest port).
//
// Ported from Prototype/src/test/validate_offline.js (scaffold plan §5.2),
// byte-identical assertion values. require('../sim/X.js') side-effect loads
// replaced with engine imports. The check() accumulator collects every original
// check; a final test asserts the count == 38 (locked spec count, unchanged).
//
// Asserts numerical parity between:
//   runner.runSimulation(params, { tier: 1, mode: "completion" })
//   offline.reconstructFromOfflineWindow(freshT1State, N_seconds, profileParams)
// plus boot-time pure-idle correctness, APS-only accrual, edge cases, purity,
// and a T1->T2 tier transition inside a window.
//
// Tolerance: <= 0.1% on mass over a 10-min replay; consolidation exact.

import { describe, it, expect } from 'vitest';
import * as offline from '../../engine/offline';
import * as runner from '../../engine/runner';
import { UPGRADES, DEFAULT_PARAMS } from '../../engine/data';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

interface CheckResult { name: string; ok: boolean; detail: string }
const RESULTS: CheckResult[] = [];
function check(name: string, ok: boolean, detail?: string): void {
  RESULTS.push({ name, ok: !!ok, detail: detail || '' });
}

function freshT1SavedState(): Any {
  return {
    mass: 0,
    consolidation: 0,
    currentTier: 1,
    levels: Object.fromEntries(UPGRADES.map(u => [u.name, 0])),
    carry: { allMps: 1.0, allMpc: 1.0, allAps: 1.0, carryMps: 0, carryMpc: 0, carryAps: 0 },
    consolidationThreshold: 1.0,
    consolidationHitMs: null,
    totalClicks: 0,
    sessionStart: 0,
    totalPausedMs: 0,
    massGainedClicks: 0,
    massGainedPassive: 0,
    massGainedAuto: 0,
    tickCount: 0,
    tierSnapshots: [{ tier: 1, startMs: 0, thresholdHitMs: null, endMs: null,
                      levelsAtEnd: null, massAtEnd: null, consolidationHitMs: null }],
  };
}

// 1. Parity test — 400-tick window at 100 cpm vs runner.
{
  const N = 400;
  const params = { cpm: 100, engagement: 1.0, saveVpcThreshold: 1.5, maxTicks: N };
  const scenario = { tier: 1, mode: 'completion' };
  const runResult = runner.runSimulation(params, scenario);

  check('parity@400s: runner did not transition (precondition)',
    !runResult.headline.transitioned,
    'runner transitioned at tick ' + runResult.headline.totalTime_s);

  const profileParams = {
    cpm: 100, engagement: 1.0,
    allowPurchases: true,
    mode: 'completion' as const,
    saveVpcThreshold: 1.5,
  };
  const offlineResult = offline.reconstructFromOfflineWindow(
    freshT1SavedState(), N, profileParams,
  );

  check('parity@400s: offline did not transition (precondition)',
    offlineResult.newState.currentTier === 1,
    'offline transitioned to tier ' + offlineResult.newState.currentTier);

  const runMass = runResult.finalState.mass;
  const offMass = offlineResult.newState.mass;
  const massDelta = Math.abs(runMass - offMass);
  const massPct = runMass > 0 ? massDelta / runMass : 0;

  check('parity@400s: mass <0.1% (runner=' + runMass.toFixed(3) + ' offline=' + offMass.toFixed(3) + ')',
    massPct <= 0.001,
    'delta=' + massDelta.toFixed(4) + ' pct=' + (massPct * 100).toFixed(4) + '%');

  for (const u of UPGRADES.filter(x => (x.tier == null ? 1 : x.tier) === 1)) {
    const r = runResult.finalState.levels[u.name] || 0;
    const o = offlineResult.newState.levels[u.name] || 0;
    check('parity@400s: levels[' + u.name + '] exact (runner=' + r + ' offline=' + o + ')',
      r === o,
      'delta=' + Math.abs(r - o));
  }

  const runCoh = runResult.finalState.consolidation;
  const offCoh = offlineResult.newState.consolidation;
  check('parity@400s: consolidation exact (runner=' + runCoh.toFixed(2) + ' offline=' + offCoh.toFixed(2) + ')',
    runCoh === offCoh);
}

// 2. Boot-time pure-idle: allowPurchases=false, cpm=0.
{
  const seed = freshT1SavedState();
  seed.mass = 200;
  seed.levels['Solar Wind'] = 5;
  seed.levels['Asteroid Belt'] = 3;

  const result = offline.reconstructFromOfflineWindow(seed, 60, {
    cpm: 0, allowPurchases: false,
  });

  check('pure-idle: no purchases', result.buyLog.length === 0,
    'buyLog has ' + result.buyLog.length + ' entries');
  check('pure-idle: levels unchanged (SW)', result.newState.levels['Solar Wind'] === 5);
  check('pure-idle: levels unchanged (AB)', result.newState.levels['Asteroid Belt'] === 3);
  check('pure-idle: consolidation unchanged', result.newState.consolidation === 0);
  check('pure-idle: tier unchanged', result.newState.currentTier === 1);

  const expectedMps = (5 * 0.00013) + (3 * 0.00033);   // = 0.00164 M☉/s
  const expectedDelta = expectedMps * 60;              // = 0.0984 M☉ over 60 s
  const actualDelta = result.newState.mass - seed.mass;
  check('pure-idle: mass growth = MPS × seconds (delta=' + actualDelta.toFixed(3) + ', expected ~' + expectedDelta.toFixed(3) + ')',
    Math.abs(actualDelta - expectedDelta) <= 0.01);

  check('pure-idle: endReason wallclock-exhausted',
    result.endReason === 'wallclock-exhausted');
  check('pure-idle: ticks = 60', result.ticks === 60);
}

// 3. Pure-idle with no MPS sources → zero mass change.
{
  const seed = freshT1SavedState();
  seed.mass = 50;
  const result = offline.reconstructFromOfflineWindow(seed, 3600, {
    cpm: 0, allowPurchases: false,
  });
  check('zero-MPS pure-idle: mass unchanged after 1h',
    Math.abs(result.newState.mass - seed.mass) <= 1e-9,
    'delta=' + (result.newState.mass - seed.mass));
  check('zero-MPS pure-idle: levels untouched',
    JSON.stringify(result.newState.levels) === JSON.stringify(seed.levels));
}

// 4. APS-driven income during pure-idle (T2 carry simulation).
{
  const seed = freshT1SavedState();
  seed.currentTier = 2;
  seed.consolidationThreshold = 2.5;
  seed.levels['Roche Lobe Overflow'] = 10;

  const result = offline.reconstructFromOfflineWindow(seed, 60, {
    cpm: 0, allowPurchases: false,
  });

  const rloDef = UPGRADES.find(u => u.name === 'Roche Lobe Overflow' && u.tier === 2) as Any;
  const baseMpc = DEFAULT_PARAMS.baseMpc;
  const aps = 10 * rloDef.addAps;
  const expected = aps * baseMpc * 60;
  const tol = Math.max(1e-9, expected * 0.01);  // 1% slop on small-scale APS income
  const actual = result.newState.mass - seed.mass;
  check('APS pure-idle: T2 RLO L10 -> ~' + expected.toFixed(6) + ' mass/60s (got ' + actual.toFixed(6) + ')',
    Math.abs(actual - expected) <= tol);
  check('APS pure-idle: massGainedAuto = ~' + expected.toFixed(6),
    Math.abs(result.newState.massGainedAuto - expected) <= tol);
  check('APS pure-idle: massGainedPassive = 0',
    Math.abs(result.newState.massGainedPassive) <= 1e-9);
  check('APS pure-idle: massGainedClicks = 0',
    Math.abs(result.newState.massGainedClicks) <= 1e-9);
}

// 5. Edge cases: 0 / negative / NaN elapsedSeconds.
{
  const seed = freshT1SavedState();
  seed.mass = 100;

  const r0 = offline.reconstructFromOfflineWindow(seed, 0, { allowPurchases: false });
  check('edge: 0 seconds -> 0 ticks', r0.ticks === 0);
  check('edge: 0 seconds -> mass unchanged', r0.newState.mass === seed.mass);

  const rNeg = offline.reconstructFromOfflineWindow(seed, -10, { allowPurchases: false });
  check('edge: -10 seconds -> 0 ticks', rNeg.ticks === 0);

  const rNaN = offline.reconstructFromOfflineWindow(seed, NaN, { allowPurchases: false });
  check('edge: NaN seconds -> 0 ticks', rNaN.ticks === 0);
}

// 6. Purity: same inputs -> same outputs; input not mutated.
{
  const seed = freshT1SavedState();
  seed.mass = 500;
  seed.levels['Solar Wind'] = 8;
  const seedSerialized = JSON.stringify(seed);

  const r1 = offline.reconstructFromOfflineWindow(seed, 120, {
    cpm: 60, engagement: 1.0, allowPurchases: true, mode: 'completion',
    saveVpcThreshold: 1.5,
  });
  check('purity: input savedState not mutated',
    JSON.stringify(seed) === seedSerialized);

  const r2 = offline.reconstructFromOfflineWindow(seed, 120, {
    cpm: 60, engagement: 1.0, allowPurchases: true, mode: 'completion',
    saveVpcThreshold: 1.5,
  });
  check('purity: identical inputs -> identical mass',
    r1.newState.mass === r2.newState.mass,
    'r1=' + r1.newState.mass + ' r2=' + r2.newState.mass);
  check('purity: identical inputs -> identical levels',
    JSON.stringify(r1.newState.levels) === JSON.stringify(r2.newState.levels));
  check('purity: identical inputs -> identical buyLog count',
    r1.buyLog.length === r2.buyLog.length);
}

// 7. Tier transition handling: run long enough to cross T1 -> T2.
{
  const seed = freshT1SavedState();
  const result = offline.reconstructFromOfflineWindow(seed, 900, {
    cpm: 100, engagement: 1.0, allowPurchases: true, mode: 'completion',
    saveVpcThreshold: 1.5,
  });

  check('tier-up: completes T1 and enters T2 (currentTier=' + result.newState.currentTier + ')',
    result.newState.currentTier >= 2);

  const tierUps = result.milestones.filter(m => m.kind === 'tier-up');
  check('tier-up: milestone recorded',
    tierUps.length >= 1,
    'milestones=' + result.milestones.length);

  if (tierUps.length >= 1) {
    check('tier-up: milestone carries mass field (S4)',
      tierUps[0].mass != null && Number.isFinite(tierUps[0].mass) && tierUps[0].mass > 0,
      'mass=' + tierUps[0].mass);
  }

  if (result.newState.currentTier >= 2) {
    check('tier-up: carry.carryMps > 0 (T1 contributions seeded)',
      result.newState.carry.carryMps > 0,
      'carryMps=' + result.newState.carry.carryMps);
    check('tier-up: carry.allMps acquired from T1',
      result.newState.carry.allMps > 1.0 || result.newState.carry.allMpc > 1.0,
      'allMps=' + result.newState.carry.allMps + ' allMpc=' + result.newState.carry.allMpc);
  }
}

// -----------------------------------------------------------------------
// Surface every collected check as a Vitest test + assert the locked count.
// -----------------------------------------------------------------------
describe('validate_offline (ported, locked count 38)', () => {
  it('runs exactly 38 checks (locked spec count, unchanged from prototype)', () => {
    expect(RESULTS.length).toBe(38);
  });
  it.each(RESULTS.map((r, i) => [i, r] as const))('%i: %o', (_i, r) => {
    expect(r.ok, r.name + (r.detail ? '  — ' + r.detail : '')).toBe(true);
  });
});
