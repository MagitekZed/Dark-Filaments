// Dark Filaments — save-module migration / round-trip test (Node-only)
// Run via: node Prototype/src/test/save_migration_test.js
//
// Long-burn v1, Engineering Phase 1 (E1) verification harness. Locked spec:
// the round-trip test that must run green after every save.js change, and
// after every SAVE_VERSION bump.
//
// Exit code 0 = all green. Non-zero = at least one assertion failed.
//
// Covers:
//   1. Round-trip parity: a synthetic live-state object serialized →
//      deserialized must produce identical numeric fields (and a payload
//      whose canonical carry shape can be translated back losslessly).
//   2. schemaSig: stable for a fixed UPGRADES list; differs when upgrade
//      order changes.
//   3. Version migration: payload.version > SAVE_VERSION refused; payload
//      with no version refused.
//   4. SavePayload contract: every field the engineering plan §3 calls out
//      is present on a round-tripped payload.

'use strict';

// Load sim modules — order matters; data.js must be loaded before save.js
// since save.js reads DF.sim.data lazily.
require('../sim/data.js');
const save = require('../sim/save.js');
const data = (typeof window !== 'undefined' ? window : globalThis).DF.sim.data;

let failures = 0;
let total = 0;
const RESULTS = [];

function check(name, ok, detail) {
  total++;
  if (!ok) failures++;
  RESULTS.push({ name, ok, detail: detail || '' });
}

function eq(a, b) { return a === b; }
function close(a, b, eps) { return Math.abs(a - b) <= (eps == null ? 1e-9 : eps); }

// Build a synthetic live state covering every field the serializer reads —
// shaped to mirror what playtest.js's `state` looks like mid-T3 with carry
// from T1 and T2 plus a couple of T3 purchases.
function syntheticLiveState() {
  return {
    mass: 1234567.89,
    consolidation: 2.4,
    currentTier: 3,
    levels: {
      'Solar Wind': 17,
      'Asteroid Belt': 12,
      'Stellar Coupling': 8,
      'Magnetosphere': 5,
      'Orbital Resonance': 1,
      'Heliopause': 1,
      'First Photons': 1,
      'Stellar Kinematics': 14,
      'Local Bubble': 10,
      'Microlensing': 6,
      'Roche Lobe Overflow': 4,
      'Brown Dwarf': 3,
      'Binary Partner': 1,
      'Peculiar Velocity': 1,
      'Open Cluster': 1,
      'Moving Group': 0,
      'Dust Lane Density': 5,
      'HII Region': 3,
    },
    carry: {
      allMps: 2.625,
      allMpc: 1.56,
      allAps: 1.0,
      mpsFloor: 411.45,
      mpcFloor: 0.0,
      apsFloor: 0.09,
    },
    consolidationThreshold: 6.25,
    consolidationHitMs: null,
    clicks: 12345,
    sessionStart: 1715520000000,
    totalPausedMs: 120000,
    massFromClicks: 4321.0,
    massFromPassive: 999999.0,
    massFromAuto: 230247.89,
    tickCount: 8400,
    tierSnapshots: [
      { tier: 1, startMs: 0, thresholdHitMs: 280000, endMs: 480000,
        levelsAtEnd: { 'Solar Wind': 12, 'Asteroid Belt': 9 },
        massAtEnd: 980.0, consolidationHitMs: 280000 },
      { tier: 2, startMs: 480000, thresholdHitMs: 1450000, endMs: 2410000,
        levelsAtEnd: { 'Stellar Kinematics': 14, 'Local Bubble': 10 },
        massAtEnd: 75000.0, consolidationHitMs: 1450000 },
      { tier: 3, startMs: 2410000, thresholdHitMs: null, endMs: null,
        levelsAtEnd: null, massAtEnd: null, consolidationHitMs: null },
    ],
    // Transient fields not persisted — set anyway to make sure they don't leak.
    log: [{ type: 'click', t_ms: 100 }],
    clickTimestamps: [10, 20, 30],
    paused: false,
    pauseStartedAt: null,
    ended: false,
  };
}

// -----------------------------------------------------------------------
// 1. Round-trip parity
// -----------------------------------------------------------------------
{
  const live = syntheticLiveState();
  const payload = save.serializeState(live, { devSkipsApplied: 2 });

  // Core fields land in payload.game.
  check('round-trip: version',          eq(payload.version, data.SAVE_VERSION));
  check('round-trip: schemaSig present', typeof payload.schemaSig === 'string' && payload.schemaSig.length > 0);
  check('round-trip: savedAt present',  typeof payload.savedAt === 'number' && payload.savedAt > 0);
  check('round-trip: mass',             close(payload.game.mass, live.mass));
  check('round-trip: consolidation',         close(payload.game.consolidation, live.consolidation));
  check('round-trip: currentTier',      eq(payload.game.currentTier, live.currentTier));
  check('round-trip: levels count',     eq(Object.keys(payload.game.levels).length, Object.keys(live.levels).length));
  check('round-trip: levels[SW]',       eq(payload.game.levels['Solar Wind'], live.levels['Solar Wind']));
  check('round-trip: levels[HII]',      eq(payload.game.levels['HII Region'], live.levels['HII Region']));

  // Carry translation: live mpsFloor → canonical carryMps; allMps preserved.
  check('round-trip: carry.allMps',   close(payload.game.carry.allMps, live.carry.allMps));
  check('round-trip: carry.allMpc',   close(payload.game.carry.allMpc, live.carry.allMpc));
  check('round-trip: carry.carryMps', close(payload.game.carry.carryMps, live.carry.mpsFloor));
  check('round-trip: carry.carryMpc', close(payload.game.carry.carryMpc, live.carry.mpcFloor));
  check('round-trip: carry.carryAps', close(payload.game.carry.carryAps, live.carry.apsFloor));

  check('round-trip: consolidationThreshold', close(payload.game.consolidationThreshold, live.consolidationThreshold));
  check('round-trip: totalClicks',       eq(payload.game.totalClicks, live.clicks));
  check('round-trip: sessionStart',      eq(payload.game.sessionStart, live.sessionStart));
  check('round-trip: totalPausedMs',     eq(payload.game.totalPausedMs, live.totalPausedMs));
  check('round-trip: tickCount',         eq(payload.game.tickCount, live.tickCount));
  check('round-trip: massGainedClicks',  close(payload.game.massGainedClicks, live.massFromClicks));
  check('round-trip: massGainedPassive', close(payload.game.massGainedPassive, live.massFromPassive));
  check('round-trip: massGainedAuto',    close(payload.game.massGainedAuto, live.massFromAuto));

  check('round-trip: tierSnapshots length', eq(payload.game.tierSnapshots.length, live.tierSnapshots.length));
  check('round-trip: tierSnapshots[0].thresholdHitMs',
    eq(payload.game.tierSnapshots[0].thresholdHitMs, live.tierSnapshots[0].thresholdHitMs));
  check('round-trip: tierSnapshots[1].levelsAtEnd[SK]',
    eq(payload.game.tierSnapshots[1].levelsAtEnd['Stellar Kinematics'],
       live.tierSnapshots[1].levelsAtEnd['Stellar Kinematics']));

  // Transient fields must NOT appear in the payload.
  check('round-trip: log not persisted',         !('log' in payload.game));
  check('round-trip: clickTimestamps not persisted', !('clickTimestamps' in payload.game));
  check('round-trip: paused not persisted',      !('paused' in payload.game));

  // meta fields land on the meta block.
  check('round-trip: meta.devSkipsApplied', eq(payload.meta.devSkipsApplied, 2));
  check('round-trip: meta.appBuild',        eq(payload.meta.appBuild, 'long-burn-v1'));

  // Now deserialize and verify we can reconstitute the canonical payload shape.
  const restored = save.deserializeState(JSON.parse(JSON.stringify(payload)));
  check('deserialize: shape returns game', restored && !!restored.game);
  check('deserialize: mass round-trip',    close(restored.game.mass, live.mass));
  check('deserialize: consolidation round-trip', close(restored.game.consolidation, live.consolidation));
  check('deserialize: levels[SW] round-trip', eq(restored.game.levels['Solar Wind'], 17));
  check('deserialize: carry.allMps round-trip', close(restored.game.carry.allMps, live.carry.allMps));
  check('deserialize: carry.carryMps round-trip', close(restored.game.carry.carryMps, live.carry.mpsFloor));
  check('deserialize: tierSnapshots round-trip', eq(restored.game.tierSnapshots.length, 3));
  check('deserialize: schemaSigCurrent computed', typeof restored.schemaSigCurrent === 'string' && restored.schemaSigCurrent.length > 0);
  check('deserialize: schemaSigMismatch false on identical UPGRADES', eq(restored.schemaSigMismatch, false));
}

// -----------------------------------------------------------------------
// 2. schemaSig stability + sensitivity
// -----------------------------------------------------------------------
{
  const sig = save.computeSchemaSig(data.UPGRADES);
  check('schemaSig: nonempty for real UPGRADES', typeof sig === 'string' && sig.length > 0);

  // Stable across two calls (no hidden ordering).
  const sig2 = save.computeSchemaSig(data.UPGRADES);
  check('schemaSig: stable across calls', eq(sig, sig2));

  // Sensitive to order: swap two adjacent upgrades and require a different sig.
  const swapped = data.UPGRADES.slice();
  const tmp = swapped[0]; swapped[0] = swapped[1]; swapped[1] = tmp;
  const sigSwapped = save.computeSchemaSig(swapped);
  check('schemaSig: differs when order changes', sig !== sigSwapped);

  // Sensitive to name change.
  const renamed = data.UPGRADES.slice();
  renamed[0] = Object.assign({}, renamed[0], { name: renamed[0].name + ' (renamed)' });
  const sigRenamed = save.computeSchemaSig(renamed);
  check('schemaSig: differs when name changes', sig !== sigRenamed);

  // Empty / null cases handled gracefully.
  check('schemaSig: empty array -> "empty"', eq(save.computeSchemaSig([]), 'empty'));
}

// -----------------------------------------------------------------------
// 3. Version handling
// -----------------------------------------------------------------------
{
  const live = syntheticLiveState();
  const payload = save.serializeState(live);

  // Future-version payload must be refused.
  const futurePayload = JSON.parse(JSON.stringify(payload));
  futurePayload.version = data.SAVE_VERSION + 1;
  const futureResult = save.deserializeState(futurePayload);
  check('version: future-version payload refused',
    futureResult && futureResult.error === 'newer_save_version');

  // Pre-current versions (v1 pre-M☉-retune; v2 pre-ladder-renumber;
  // v3 pre-consolidation-rename) must all be refused with the legacy-version
  // error. The rename pass bumped SAVE_VERSION 3 → 4, so a v3 payload
  // hitting a v4 reader would silently load the legacy `cohesion*` keys as
  // zero and corrupt transition gates.
  for (let v = 1; v < data.SAVE_VERSION; v++) {
    const oldPayload = JSON.parse(JSON.stringify(payload));
    oldPayload.version = v;
    const oldResult = save.deserializeState(oldPayload);
    check('version: v' + v + ' payload refused',
      oldResult && oldResult.error === 'pre_retune_save_version_' + v);
  }

  // No-version payload returns null (malformed).
  const malformed = JSON.parse(JSON.stringify(payload));
  delete malformed.version;
  const malformedResult = save.deserializeState(malformed);
  check('version: missing-version payload -> null', malformedResult === null);

  // Null / wrong-type input handled gracefully.
  check('version: null payload -> null', save.deserializeState(null) === null);
  check('version: string payload -> null', save.deserializeState('not a payload') === null);
}

// -----------------------------------------------------------------------
// 4. Schema-sig mismatch surfaces a warning, does not refuse
// -----------------------------------------------------------------------
{
  const live = syntheticLiveState();
  const payload = save.serializeState(live);
  // Mutate the persisted schemaSig as if upgrades had drifted since save.
  payload.schemaSig = 'deadbeef';
  const restored = save.deserializeState(payload);
  check('schemaSigMismatch: payload still loads', restored && !!restored.game);
  check('schemaSigMismatch: flag set true', restored && restored.schemaSigMismatch === true);
}

// -----------------------------------------------------------------------
// 5. JSON round-trip is byte-identical (no NaN / undefined leaks)
// -----------------------------------------------------------------------
{
  const live = syntheticLiveState();
  const payload = save.serializeState(live);
  let json;
  try { json = JSON.stringify(payload); }
  catch (e) { json = null; }
  check('JSON: serialize succeeds', typeof json === 'string' && json.length > 0);
  const reparsed = json ? JSON.parse(json) : null;
  check('JSON: reparsed.game.mass matches', reparsed && close(reparsed.game.mass, live.mass));
  check('JSON: reparsed.game.levels[SW] matches', reparsed && eq(reparsed.game.levels['Solar Wind'], 17));
}

// -----------------------------------------------------------------------
// Report
// -----------------------------------------------------------------------
const passed = total - failures;
console.log('save_migration_test — ' + passed + ' / ' + total + ' checks passed');
if (failures > 0) {
  console.log('');
  for (const r of RESULTS) {
    if (!r.ok) console.log('  FAIL  ' + r.name + (r.detail ? '  — ' + r.detail : ''));
  }
  process.exit(1);
} else {
  process.exit(0);
}
