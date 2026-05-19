// Dark Filaments — Subhalo hidden-channel parity test (Node-only)
// Run via: node Prototype/src/test/validate_subhalo.js
//
// Step C verification harness for the `carryMpsMult` engine extension landed
// 2026-05-13. Locked spec: must run green after every change to core.computeRates,
// strategy.stackableVpc, or the Subhalo data.js entry.
//
// Asserts:
//   1. Identity (0 Subhalo levels): mps is byte-identical to the legacy formula.
//   2. L1 / L2 / L3 Subhalo, no synergies: factor scales α / α^2 / α^3, applied
//      to carryMps only (not sumMps).
//   3. Population II synergy compounds the per-level coefficient pre-exponentiation.
//   4. Brown Dwarf cross-tier synergy compounds the per-level coefficient.
//   5. B + C synergies compound multiplicatively into α_eff_per_level.
//   6. Hidden factor persists through tier transition: Subhalo owned at T3
//      continues to amplify carryMps when the player is in T4.
//   7. Subhalo's per-upgrade row contribution is zero on every stat.
//   8. Offline accrual integrates the hidden factor correctly (parity vs runner).
//   9. Edge: carryMps=0 → hidden factor multiplies zero → no effect.
//  10. No-op when no upgrade declares carryMpsMult.
//  11. Purity: computeRates does not mutate state.
//  12. Strategy VPC parity: stackableVpc returns the expected delta.
//
// Tolerance: <= 1e-9 for analytic identities; <= 0.1% on offline parity (matches
// validate_offline.js policy).

'use strict';

require('../sim/data.js');
require('../sim/core.js');
require('../sim/strategy.js');
require('../sim/runner.js');
const offline = require('../sim/offline.js');
const runner = require('../sim/runner.js');
const core = require('../sim/core.js');
const strategy = require('../sim/strategy.js');
const data = (typeof window !== 'undefined' ? window : globalThis).DF.sim.data;

let failures = 0;
let total = 0;
const RESULTS = [];

function check(name, ok, detail) {
  total++;
  if (!ok) failures++;
  RESULTS.push({ name, ok, detail: detail || '' });
}

function approx(a, b, tol) {
  const t = tol == null ? 1e-9 : tol;
  if (a === b) return true;
  const denom = Math.max(Math.abs(a), Math.abs(b), 1);
  return Math.abs(a - b) / denom <= t;
}

// Locate the canonical upgrade entries we test against.
const SUBHALO = data.UPGRADES.find(u => u.name === 'Subhalo' && u.tier === 3);
const POP_II  = data.UPGRADES.find(u => u.name === 'Population II' && u.tier === 3);
const BD      = data.UPGRADES.find(u => u.name === 'Brown Dwarf' && u.tier === 2);
const T3_UPGRADES = data.UPGRADES.filter(u => (u.tier == null ? 1 : u.tier) === 3);

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
  POP_II && POP_II.synergies && POP_II.synergies.some(s =>
    s.target === 'Subhalo' && s.kind === 'additive' && s.multiplier > 1.0));
check('precondition: Brown Dwarf declares additive Subhalo synergy (cross-tier)',
  BD && BD.synergies && BD.synergies.some(s =>
    s.target === 'Subhalo' && s.kind === 'additive' && s.multiplier > 1.0));

const ALPHA = SUBHALO.carryMpsMult;
const BETA_B = POP_II.synergies.find(s => s.target === 'Subhalo').multiplier - 1;
const BETA_C = BD.synergies.find(s => s.target === 'Subhalo').multiplier - 1;

// Synthesize a T3 state with known carryMps + sumMps and zero allMps multipliers.
// allUpgrades = data.UPGRADES so the provider walk reaches T2 BD too.
function makeState(subhaloLvl, popIILvl, bdLvl) {
  const levels = Object.fromEntries(data.UPGRADES.map(u => [u.name, 0]));
  if (subhaloLvl) levels['Subhalo'] = subhaloLvl;
  if (popIILvl)   levels['Population II'] = popIILvl;
  if (bdLvl)      levels['Brown Dwarf'] = bdLvl;
  return { mass: 0, consolidation: 0, levels };
}

const CARRY = { allMps: 1.0, allMpc: 1.0, allAps: 1.0, carryMps: 100, carryMpc: 0, carryAps: 0 };
const PARAMS = { baseMpc: 0.0012 };

// -----------------------------------------------------------------------
// 1. Identity case — 0 Subhalo levels: hidden factor = 1, rate matches legacy.
// -----------------------------------------------------------------------
{
  const s = makeState(0, 0, 0);
  const r = core.computeRates(s, T3_UPGRADES, CARRY, PARAMS, data.UPGRADES);
  // Expected MPS: (carryMps + 0) × 1 × 1 = 100.
  check('identity: 0 Subhalo levels -> hidden factor 1.0 (mps=' + r.mps + ')',
    approx(r.mps, 100));
}

// -----------------------------------------------------------------------
// 2. Subhalo L1/L2/L3, no synergies: factor scales α^N applied to carryMps only.
// -----------------------------------------------------------------------
{
  for (const N of [1, 2, 3]) {
    const s = makeState(N, 0, 0);
    const r = core.computeRates(s, T3_UPGRADES, CARRY, PARAMS, data.UPGRADES);
    const expected = 100 * Math.pow(ALPHA, N);
    check('no-synergy: L' + N + ' Subhalo -> mps = carryMps × α^' + N
          + ' (got=' + r.mps.toFixed(6) + ', expected=' + expected.toFixed(6) + ')',
      approx(r.mps, expected));
  }
}

// -----------------------------------------------------------------------
// 3. L1 Subhalo + Synergy B (Population II = 5): factor = (α × (1 + 5β_B))^1.
//    Population II contributes its own MPS too (baseMps=1.5, selfMps=1.12).
//    But since Subhalo is at L1 and Pop II is in the providers, the hidden
//    factor uses α_eff = α × (1 + 5β_B) applied to carryMps. We verify the
//    DELTA (rate with Subhalo - rate without) matches the expected hidden gain.
// -----------------------------------------------------------------------
{
  const sWithout = makeState(0, 5, 0);
  const sWith    = makeState(1, 5, 0);
  const rWo = core.computeRates(sWithout, T3_UPGRADES, CARRY, PARAMS, data.UPGRADES);
  const rW  = core.computeRates(sWith,    T3_UPGRADES, CARRY, PARAMS, data.UPGRADES);
  const aEff = ALPHA * (1 + 5 * BETA_B);
  const expectedDelta = 100 * (Math.pow(aEff, 1) - 1);
  const actualDelta = rW.mps - rWo.mps;
  check('synergy-B: L1 Subhalo + 5 PopII -> hidden factor α × (1 + 5β_B) '
        + '(delta got=' + actualDelta.toFixed(6) + ', expected=' + expectedDelta.toFixed(6) + ')',
    approx(actualDelta, expectedDelta, 1e-9));
}

// -----------------------------------------------------------------------
// 4. L2 Subhalo + Synergy C (Brown Dwarf = 10): factor = (α × (1 + 10β_C))^2.
//    BD is cross-tier (T2); we verify the provider walk reaches it. BD also
//    contributes its own MPS (addMps=0.0741) but that lives in sumMps, NOT
//    the hidden factor — so the delta test isolates the hidden channel.
//    Cap BD level to its maxLevels (5). The math still holds; the synergyMult
//    additive shape just resolves with whatever provider level we pass.
// -----------------------------------------------------------------------
{
  const BD_LEVEL = Math.min(10, BD.maxLevels);
  const sWithout = makeState(0, 0, BD_LEVEL);
  const sWith    = makeState(2, 0, BD_LEVEL);
  const rWo = core.computeRates(sWithout, T3_UPGRADES, CARRY, PARAMS, data.UPGRADES);
  const rW  = core.computeRates(sWith,    T3_UPGRADES, CARRY, PARAMS, data.UPGRADES);
  const aEff = ALPHA * (1 + BD_LEVEL * BETA_C);
  const expectedDelta = 100 * (Math.pow(aEff, 2) - 1);
  const actualDelta = rW.mps - rWo.mps;
  check('synergy-C: L2 Subhalo + ' + BD_LEVEL + ' BD -> hidden factor α × (1 + ' + BD_LEVEL + 'β_C) '
        + '(delta got=' + actualDelta.toFixed(6) + ', expected=' + expectedDelta.toFixed(6) + ')',
    approx(actualDelta, expectedDelta, 1e-9));
}

// -----------------------------------------------------------------------
// 5. L3 Subhalo + B + C together: factor = (α × (1 + N_PopII β_B) × (1 + N_BD β_C))^3.
// -----------------------------------------------------------------------
{
  const BD_LEVEL = Math.min(10, BD.maxLevels);
  const sWithout = makeState(0, 7, BD_LEVEL);
  const sWith    = makeState(3, 7, BD_LEVEL);
  const rWo = core.computeRates(sWithout, T3_UPGRADES, CARRY, PARAMS, data.UPGRADES);
  const rW  = core.computeRates(sWith,    T3_UPGRADES, CARRY, PARAMS, data.UPGRADES);
  const aEff = ALPHA * (1 + 7 * BETA_B) * (1 + BD_LEVEL * BETA_C);
  const expectedDelta = 100 * (Math.pow(aEff, 3) - 1);
  const actualDelta = rW.mps - rWo.mps;
  check('synergy-B+C: L3 Subhalo + 7 PopII + ' + BD_LEVEL + ' BD -> factor compounds correctly '
        + '(delta got=' + actualDelta.toFixed(6) + ', expected=' + expectedDelta.toFixed(6) + ')',
    approx(actualDelta, expectedDelta, 1e-9));
}

// -----------------------------------------------------------------------
// 6. T3 → T4 transition: Subhalo owned at L2 must continue amplifying
//    carryMps once the player is in T4. The provider walk includes Subhalo
//    because synergyProviders = allUpgrades, and Subhalo is at tier 3 (a
//    prior tier from T4's perspective).
// -----------------------------------------------------------------------
{
  const T4_UPGRADES = data.UPGRADES.filter(u => (u.tier == null ? 1 : u.tier) === 4);
  // T4 carry contains Subhalo L2 in the state's levels. Build a state with
  // Subhalo L2 owned (from T3) and verify the hidden factor still applies.
  const levels = Object.fromEntries(data.UPGRADES.map(u => [u.name, 0]));
  levels['Subhalo'] = 2;
  const sWith    = { mass: 0, consolidation: 0, levels };
  const sWithout = { mass: 0, consolidation: 0, levels: Object.assign({}, levels, { Subhalo: 0 }) };
  // Use a non-trivial T1-T3 carry baseline. The carry payload simulates the
  // post-T3 handoff: carryMps non-zero, all-mult non-trivial.
  const carry = { allMps: 1.5, allMpc: 1.0, allAps: 1.0, carryMps: 200, carryMpc: 0, carryAps: 0 };
  const rWo = core.computeRates(sWithout, T4_UPGRADES, carry, PARAMS, data.UPGRADES);
  const rW  = core.computeRates(sWith,    T4_UPGRADES, carry, PARAMS, data.UPGRADES);
  // Hidden factor at L2 with no synergy providers = α^2 (Pop II=0, BD=0).
  const expectedDelta = 200 * (Math.pow(ALPHA, 2) - 1) * 1.5; // × allMpsCarry
  const actualDelta = rW.mps - rWo.mps;
  check('transition: Subhalo L2 still applies at T4 (delta got=' + actualDelta.toFixed(6)
        + ', expected=' + expectedDelta.toFixed(6) + ')',
    approx(actualDelta, expectedDelta, 1e-9));
}

// -----------------------------------------------------------------------
// 7. Stat-display contract: Subhalo's per-upgrade contribution row is zero
//    across MPS/MPC/APS. This means the row reads 0 in any stat-display UI
//    that walks selfContrib(N, base, add, self) per upgrade.
// -----------------------------------------------------------------------
{
  const N = 5;
  const selfMps = core.selfContrib(N, SUBHALO.baseMps, SUBHALO.addMps, SUBHALO.selfMps);
  const selfMpc = core.selfContrib(N, SUBHALO.baseMpc, SUBHALO.addMpc, SUBHALO.selfMpc);
  const selfAps = core.selfContrib(N, SUBHALO.baseAps, SUBHALO.addAps, SUBHALO.selfAps);
  check('stat-display: Subhalo selfMps row = 0 at L' + N, selfMps === 0,
    'got ' + selfMps);
  check('stat-display: Subhalo selfMpc row = 0 at L' + N, selfMpc === 0,
    'got ' + selfMpc);
  check('stat-display: Subhalo selfAps row = 0 at L' + N, selfAps === 0,
    'got ' + selfAps);
}

// -----------------------------------------------------------------------
// 8. Offline-accrual integration: reconstructFromOfflineWindow walks the same
//    computeRates path, so Subhalo's hidden factor must take effect during
//    pure-idle offline windows. Build a T3 state with Subhalo L2 + non-zero
//    carryMps, idle 60 s with allowPurchases=false, verify the mass gain
//    matches the analytic prediction.
// -----------------------------------------------------------------------
{
  const seed = {
    mass: 0, consolidation: 0, currentTier: 3,
    levels: Object.fromEntries(data.UPGRADES.map(u => [u.name, 0])),
    carry: { allMps: 1.0, allMpc: 1.0, allAps: 1.0, carryMps: 50, carryMpc: 0, carryAps: 0 },
    consolidationThreshold: 6.25, consolidationHitMs: null,
    totalClicks: 0, sessionStart: 0, totalPausedMs: 0,
    massGainedClicks: 0, massGainedPassive: 0, massGainedAuto: 0,
    tickCount: 0,
    tierSnapshots: [{ tier: 3, startMs: 0, thresholdHitMs: null, endMs: null,
                     levelsAtEnd: null, massAtEnd: null, consolidationHitMs: null }],
  };
  seed.levels['Subhalo'] = 2;
  // Pure-idle 60 s. perTierEngagement irrelevant when cpm=0 / allowPurchases=false.
  const result = offline.reconstructFromOfflineWindow(seed, 60, {
    cpm: 0, allowPurchases: false,
  });
  // Expected per-tick MPS: carryMps × α^2 = 50 × α^2. Over 60 ticks: 60 × that.
  const expectedMps = 50 * Math.pow(ALPHA, 2);
  const expectedDelta = expectedMps * 60;
  const actualDelta = result.newState.mass;
  check('offline: Subhalo L2 hidden factor applies in pure-idle (got=' + actualDelta.toFixed(6)
        + ', expected=' + expectedDelta.toFixed(6) + ')',
    approx(actualDelta, expectedDelta, 1e-6));
  check('offline: Subhalo L2 NOT raw carry (raw=' + (50 * 60) + ', actual=' + actualDelta.toFixed(6) + ')',
    actualDelta > 50 * 60 + 1e-6);
}

// -----------------------------------------------------------------------
// 9. Edge: carryMps = 0 → hidden factor multiplies zero → no effect.
// -----------------------------------------------------------------------
{
  const carry0 = { allMps: 1.0, allMpc: 1.0, allAps: 1.0, carryMps: 0, carryMpc: 0, carryAps: 0 };
  const sWithout = makeState(0, 0, 0);
  const sWith    = makeState(5, 0, 0);
  const rWo = core.computeRates(sWithout, T3_UPGRADES, carry0, PARAMS, data.UPGRADES);
  const rW  = core.computeRates(sWith,    T3_UPGRADES, carry0, PARAMS, data.UPGRADES);
  check('edge: carryMps=0 -> Subhalo L5 changes nothing (rWo=' + rWo.mps.toFixed(6)
        + ', rW=' + rW.mps.toFixed(6) + ')',
    approx(rWo.mps, rW.mps, 1e-12));
}

// -----------------------------------------------------------------------
// 10. No-op when no upgrade declares carryMpsMult (T1 / T2 byte-identical).
//     Sanity: T1 computeRates with carry=identity matches legacy computeMps.
// -----------------------------------------------------------------------
{
  const T1 = data.UPGRADES.filter(u => (u.tier == null ? 1 : u.tier) === 1);
  const t1Has = T1.some(u => u.carryMpsMult != null);
  check('no-op: T1 upgrades declare no carryMpsMult', !t1Has);
  // Build a T1 state with some levels; verify computeRates.mps matches legacy.
  const levels = Object.fromEntries(data.UPGRADES.map(u => [u.name, 0]));
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

// -----------------------------------------------------------------------
// 11. Purity: computeRates does not mutate state.
// -----------------------------------------------------------------------
{
  const s = makeState(3, 5, 4);
  const snapshot = JSON.stringify(s);
  core.computeRates(s, T3_UPGRADES, CARRY, PARAMS, data.UPGRADES);
  check('purity: state.levels not mutated', JSON.stringify(s) === snapshot);
  // Determinism: same inputs twice -> same output.
  const r1 = core.computeRates(s, T3_UPGRADES, CARRY, PARAMS, data.UPGRADES);
  const r2 = core.computeRates(s, T3_UPGRADES, CARRY, PARAMS, data.UPGRADES);
  check('purity: deterministic mps', r1.mps === r2.mps);
  check('purity: deterministic mpc', r1.mpc === r2.mpc);
  check('purity: deterministic aps', r1.aps === r2.aps);
}

// -----------------------------------------------------------------------
// 12. Strategy VPC parity: stackableVpc returns the expected delta for Subhalo.
//     With Subhalo at L2 (next purchase is L3), no Pop II / BD owned:
//       α_eff = α
//       delta_factor = α^2 × (α - 1)
//       delta_mps    = carryMps × delta_factor × allMps_total
//       vpc          = delta_mps / nextCost(Subhalo, 2)
// -----------------------------------------------------------------------
{
  const s = makeState(2, 0, 0);
  const params = {
    cpm: 100, engagement: 1.0,
    baseMpc: PARAMS.baseMpc,
    carry: { allMps: 1.0, allMpc: 1.0, allAps: 1.0 },
    carryMps: 100, carryMpc: 0, carryAps: 0,
    synergyProviders: data.UPGRADES,
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
  check('strategy: Subhalo VPC > 0 (strategy will consider buying)',
    vpc > 0);
}

// VPC with synergies present (Pop II = 5, BD = 4): α_eff_per_level compounds.
{
  const s = makeState(1, 5, 4);
  const params = {
    cpm: 100, engagement: 1.0,
    baseMpc: PARAMS.baseMpc,
    carry: { allMps: 1.0, allMpc: 1.0, allAps: 1.0 },
    carryMps: 500, carryMpc: 0, carryAps: 0,
    synergyProviders: data.UPGRADES,
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

// VPC with carryMps=0: returns 0 (edge case).
{
  const s = makeState(2, 0, 0);
  const params = {
    cpm: 100, engagement: 1.0,
    baseMpc: PARAMS.baseMpc,
    carry: { allMps: 1.0, allMpc: 1.0, allAps: 1.0 },
    carryMps: 0, carryMpc: 0, carryAps: 0,
    synergyProviders: data.UPGRADES,
  };
  const vpc = strategy.stackableVpc('Subhalo', s, params, T3_UPGRADES);
  check('strategy: Subhalo VPC at carryMps=0 returns 0',
    vpc === 0, 'got ' + vpc);
}

// -----------------------------------------------------------------------
// Report
// -----------------------------------------------------------------------
const passed = total - failures;
console.log('validate_subhalo — ' + passed + ' / ' + total + ' checks passed');
if (failures > 0) {
  console.log('');
  for (const r of RESULTS) {
    if (!r.ok) console.log('  FAIL  ' + r.name + (r.detail ? '  — ' + r.detail : ''));
  }
  process.exit(1);
} else {
  process.exit(0);
}
