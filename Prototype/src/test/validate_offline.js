// Dark Filaments — offline-math parity test (Node-only)
// Run via: node Prototype/src/test/validate_offline.js
//
// Long-burn v1, Engineering Phase 3 (E3) verification harness. Locked spec:
// must run green after every offline.js change.
//
// Asserts numerical parity between:
//   runner.runSimulation(params, { tier: 1, mode: "completion" })
//   offline.reconstructFromOfflineWindow(freshT1State, N_seconds, profileParams)
//
// with matching parameters (cpm=100, engagement=1.0, saveVpcThreshold=1.5,
// mode="completion", allowPurchases=true).
//
// Tolerance (per engineering plan §3 dt strategy):
//   "harness assumes <=0.1% delta on mass over a 10-min replay."
// We assert <= 0.1% on mass and <= 1 level mismatch per stackable. Consolidation
// must match exactly (integer-sum semantics).
//
// Additional sanity checks:
//   - Boot-time pure-idle mode (allowPurchases=false, cpm=0) produces
//     monotone mass growth from MPS alone, no purchases.
//   - Idle window with no MPS sources yields zero mass change.
//   - elapsedSeconds <= 0 / NaN / negative are handled without crashing.

'use strict';

require('../sim/data.js');
require('../sim/core.js');
require('../sim/strategy.js');
require('../sim/runner.js');
const offline = require('../sim/offline.js');
const runner = require('../sim/runner.js');
const data = (typeof window !== 'undefined' ? window : globalThis).DF.sim.data;

let failures = 0;
let total = 0;
const RESULTS = [];

function check(name, ok, detail) {
  total++;
  if (!ok) failures++;
  RESULTS.push({ name, ok, detail: detail || '' });
}

// Build a fresh T1 savedState — what playtest.js would serialize before any
// purchases. consolidationThreshold from TIER_CONFIGS[1].
function freshT1SavedState() {
  return {
    mass: 0,
    consolidation: 0,
    currentTier: 1,
    levels: Object.fromEntries(data.UPGRADES.map(u => [u.name, 0])),
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

// -----------------------------------------------------------------------
// 1. Parity test — 400-tick window at 100 cpm vs runner
//    400 < 495 (typical T1 completion at 100 cpm engagement 1.0), so neither
//    side transitions during the window. After the transition the two paths
//    diverge structurally (the runner is tier-bounded; offline continues into
//    T2). For the load-bearing parity assertion we compare pre-transition
//    state byte-for-byte (within numerical tolerance).
// -----------------------------------------------------------------------
{
  const N = 400;
  const params = { cpm: 100, engagement: 1.0, saveVpcThreshold: 1.5, maxTicks: N };
  const scenario = { tier: 1, mode: 'completion' };
  const runResult = runner.runSimulation(params, scenario);

  // Sanity: the runner must not have transitioned in N ticks for this parity
  // test to be meaningful. If T1 calibration ever gets fast enough that T1
  // completes in <400 ticks at 100 cpm, lower N.
  check('parity@400s: runner did not transition (precondition)',
    !runResult.headline.transitioned,
    'runner transitioned at tick ' + runResult.headline.totalTime_s);

  // Offline reconstruction with the same params and allowPurchases=true.
  const profileParams = {
    cpm: 100, engagement: 1.0,
    allowPurchases: true,
    mode: 'completion',
    saveVpcThreshold: 1.5,
  };
  const offlineResult = offline.reconstructFromOfflineWindow(
    freshT1SavedState(), N, profileParams,
  );

  // Offline shouldn't have transitioned either at this window length.
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

  // Levels: every T1 upgrade should match exactly (same strategy, same income,
  // same purchases at same ticks). No tolerance needed for this case — drift
  // would indicate divergence in the strategy invocation pipeline.
  for (const u of data.UPGRADES.filter(x => (x.tier == null ? 1 : x.tier) === 1)) {
    const r = runResult.finalState.levels[u.name] || 0;
    const o = offlineResult.newState.levels[u.name] || 0;
    check('parity@400s: levels[' + u.name + '] exact (runner=' + r + ' offline=' + o + ')',
      r === o,
      'delta=' + Math.abs(r - o));
  }

  // Consolidation: identical consolidation-bearing purchases → identical totals.
  const runCoh = runResult.finalState.consolidation;
  const offCoh = offlineResult.newState.consolidation;
  check('parity@400s: consolidation exact (runner=' + runCoh.toFixed(2) + ' offline=' + offCoh.toFixed(2) + ')',
    runCoh === offCoh);
}

// -----------------------------------------------------------------------
// 2. Boot-time pure-idle: allowPurchases=false, cpm=0
// -----------------------------------------------------------------------
{
  // Seed a partial T1 state — Solar Wind L5 and Asteroid Belt L3 owned, plus
  // some accumulated mass. With purchases off, mass grows from MPS only; no
  // levels change.
  const seed = freshT1SavedState();
  seed.mass = 200;
  seed.levels['Solar Wind'] = 5;
  seed.levels['Asteroid Belt'] = 3;
  // Pre-window passive income to verify against. MPS at this state:
  //   Solar Wind: 5 × 0.08 = 0.40 ; Asteroid Belt: 3 × 0.20 = 0.60 ; total = 1.00
  // After 60 s with no purchases, mass should rise by ~60.0.

  const result = offline.reconstructFromOfflineWindow(seed, 60, {
    cpm: 0, allowPurchases: false,
  });

  check('pure-idle: no purchases', result.buyLog.length === 0,
    'buyLog has ' + result.buyLog.length + ' entries');
  check('pure-idle: levels unchanged (SW)', result.newState.levels['Solar Wind'] === 5);
  check('pure-idle: levels unchanged (AB)', result.newState.levels['Asteroid Belt'] === 3);
  check('pure-idle: consolidation unchanged', result.newState.consolidation === 0);
  check('pure-idle: tier unchanged', result.newState.currentTier === 1);

  // Post-2026-05-12 retune (M☉ denomination + iteration-2 peak-mass anchor):
  // SW addMps = 0.00013, AB addMps = 0.00033. Test constants follow data.js.
  const expectedMps = (5 * 0.00013) + (3 * 0.00033);   // = 0.00164 M☉/s
  const expectedDelta = expectedMps * 60;              // = 0.0984 M☉ over 60 s
  const actualDelta = result.newState.mass - seed.mass;
  check('pure-idle: mass growth = MPS × seconds (delta=' + actualDelta.toFixed(3) + ', expected ~' + expectedDelta.toFixed(3) + ')',
    Math.abs(actualDelta - expectedDelta) <= 0.01);

  check('pure-idle: endReason wallclock-exhausted',
    result.endReason === 'wallclock-exhausted');
  check('pure-idle: ticks = 60', result.ticks === 60);
}

// -----------------------------------------------------------------------
// 3. Pure-idle with no MPS sources → zero mass change
// -----------------------------------------------------------------------
{
  const seed = freshT1SavedState();
  seed.mass = 50;
  // No upgrades owned; pure-idle should yield no mass change.
  const result = offline.reconstructFromOfflineWindow(seed, 3600, {
    cpm: 0, allowPurchases: false,
  });
  check('zero-MPS pure-idle: mass unchanged after 1h',
    Math.abs(result.newState.mass - seed.mass) <= 1e-9,
    'delta=' + (result.newState.mass - seed.mass));
  check('zero-MPS pure-idle: levels untouched',
    JSON.stringify(result.newState.levels) === JSON.stringify(seed.levels));
}

// -----------------------------------------------------------------------
// 4. APS-driven income during pure-idle (T2 carry simulation)
//    Roche Lobe Overflow at L10 produces 10 × addAps APS, which at
//    baseMpc=0.00120 (post-2026-05-12 retune) feeds the autoclicker income.
//    Constants pulled live from data.UPGRADES + DEFAULT_PARAMS so the test
//    survives future T2 rescales without manual update.
// -----------------------------------------------------------------------
{
  // Build a T2 state with RLO L10 owned. Carry from T1 is identity here.
  const seed = freshT1SavedState();
  seed.currentTier = 2;
  seed.consolidationThreshold = 2.5;
  // Seed: enough T1 levels to make carry non-trivial but for clarity we
  // start with identity carry (no T1 levels owned). Then RLO L10 at T2.
  // Carry stays identity (allMps=1, carryMps=0, etc.). Active tier = T2.
  // computeRates with no T2 upgrades except RLO → mps=0, mpc=baseMpc,
  // aps = 10 × RLO.addAps → autoInc = aps × mpc per tick.
  seed.levels['Roche Lobe Overflow'] = 10;

  const result = offline.reconstructFromOfflineWindow(seed, 60, {
    cpm: 0, allowPurchases: false,
  });

  const rloDef = data.UPGRADES.find(u => u.name === 'Roche Lobe Overflow' && u.tier === 2);
  const baseMpc = data.DEFAULT_PARAMS.baseMpc;
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

// -----------------------------------------------------------------------
// 5. Edge cases: 0 / negative / NaN elapsedSeconds
// -----------------------------------------------------------------------
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

// -----------------------------------------------------------------------
// 6. Purity: same inputs -> same outputs; input not mutated
// -----------------------------------------------------------------------
{
  const seed = freshT1SavedState();
  seed.mass = 500;
  seed.levels['Solar Wind'] = 8;
  const seedSerialized = JSON.stringify(seed);

  const r1 = offline.reconstructFromOfflineWindow(seed, 120, {
    cpm: 60, engagement: 1.0, allowPurchases: true, mode: 'completion',
    saveVpcThreshold: 1.5,
  });
  // Input must not have been mutated.
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

// -----------------------------------------------------------------------
// 7. Tier transition handling: run long enough to cross T1 -> T2
//    At 100 cpm in completion mode the runner finishes T1 around 500 s.
//    Verify that a 900 s offline window with allowPurchases=true completes
//    T1 and enters T2.
// -----------------------------------------------------------------------
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

  // S4: tier-up milestones must now carry a `mass` field — the exit mass
  // of the tier just transitioned out of. Offline runner stamps ws.mass at
  // the transition tick into the milestone.
  if (tierUps.length >= 1) {
    check('tier-up: milestone carries mass field (S4)',
      tierUps[0].mass != null && Number.isFinite(tierUps[0].mass) && tierUps[0].mass > 0,
      'mass=' + tierUps[0].mass);
  }

  // Carry from T1 should be non-identity after transition.
  if (result.newState.currentTier >= 2) {
    check('tier-up: carry.carryMps > 0 (T1 contributions seeded)',
      result.newState.carry.carryMps > 0,
      'carryMps=' + result.newState.carry.carryMps);
    // T1 Orbital Resonance + First Photons compound: allMps = 1.25, allMpc = 1.20
    // (assuming both bought). Either one alone is non-1; allow >=1.0 but expect
    // most runs to have at least allMps > 1 since OR is a typical buy path.
    check('tier-up: carry.allMps acquired from T1',
      result.newState.carry.allMps > 1.0 || result.newState.carry.allMpc > 1.0,
      'allMps=' + result.newState.carry.allMps + ' allMpc=' + result.newState.carry.allMpc);
  }
}

// -----------------------------------------------------------------------
// Report
// -----------------------------------------------------------------------
const passed = total - failures;
console.log('validate_offline — ' + passed + ' / ' + total + ' checks passed');
if (failures > 0) {
  console.log('');
  for (const r of RESULTS) {
    if (!r.ok) console.log('  FAIL  ' + r.name + (r.detail ? '  — ' + r.detail : ''));
  }
  process.exit(1);
} else {
  process.exit(0);
}
