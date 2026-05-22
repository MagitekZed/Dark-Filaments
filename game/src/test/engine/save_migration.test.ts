// Dark Filaments — save-module round-trip test (Vitest port, clean-break v5).
//
// Ported from Prototype/src/test/save_migration_test.js (scaffold plan §5.2)
// but CHANGES SEMANTICALLY per the §4.6 clean break:
//   - DROPPED: the v1/v2/v3 pre-retune-refusal assertions (the prototype's
//     v1-v4 lineage). The scaffold has no migration code.
//   - ADDED: v5 round-trip + `<5 refused` + `>5 refused`.
//   - The synthetic live-state uses CANONICAL carry.* names natively
//     (carryMps/carryMpc/carryAps) — NOT the prototype's relic
//     mpsFloor/mpcFloor/apsFloor. §12.6: grep confirmed no relic names leak
//     into any v5 fixture (the clean break removed them entirely; the
//     translation-round-trip assertions that referenced mpsFloor are gone).
//
// CHECK-COUNT DELTA (documented per §5.2): the prototype's save_migration_test
// ran 56 checks. This port runs 66 — a DIFFERENT count, EXPECTED and CORRECT
// for the clean break. What changed vs the prototype's 56:
//   REMOVED (-3): the v1/v2/v3 pre-retune-refusal loop (prototype iterated
//     `for v = 1; v < SAVE_VERSION` = 3 refusal checks under v4). No migration
//     lineage in the scaffold; the clean break abandons v1-v4.
//   KEPT, RENAMED: the carry round-trip checks now assert canonical
//     carryMps/carryMpc/carryAps natively instead of the mpsFloor→carryMps
//     translation (same count, relic-free fixtures per §12.6).
//   ADDED (+13): a v5-native version-load check; the `<5` (v1, v4) + `>5`
//     refusal checks reframed for the clean break; a 7-check token-codec
//     round-trip group (encodeToken/decodeToken — §4.1 barrel surface, ported
//     since cheap per §4.6); and a 3-check §12.6 relic-leak guard
//     (no mpsFloor/mpcFloor/apsFloor in the v5 fixture).
// Net: 56 - 3 + 13 = 66. The locked count for this ported file is 66.
//
// Covers: round-trip parity (canonical carry names), schemaSig stability +
// sensitivity, version handling (v5 native, <5 refused, >5 refused, missing/
// malformed), schemaSig-mismatch warn-load, and JSON byte-identity.

import { describe, it, expect } from 'vitest';
import * as save from '../../engine/save';
import { SAVE_VERSION, UPGRADES } from '../../engine/data';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

interface CheckResult { name: string; ok: boolean; detail: string }
const RESULTS: CheckResult[] = [];
function check(name: string, ok: boolean, detail?: string): void {
  RESULTS.push({ name, ok: !!ok, detail: detail || '' });
}

function eq(a: Any, b: Any): boolean { return a === b; }
function close(a: number, b: number, eps?: number): boolean { return Math.abs(a - b) <= (eps == null ? 1e-9 : eps); }

// Build a synthetic canonical EngineState covering every field the serializer
// reads — shaped to mirror a mid-T3 state with carry from T1 and T2 plus a
// couple of T3 purchases. CANONICAL carry.* names (no mpsFloor/mpcFloor/apsFloor
// relics — the clean break removed them; §12.6).
function syntheticLiveState(): Any {
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
      carryMps: 411.45,
      carryMpc: 0.0,
      carryAps: 0.09,
    },
    consolidationThreshold: 6.25,
    consolidationHitMs: null,
    totalClicks: 12345,
    sessionStart: 1715520000000,
    totalPausedMs: 120000,
    massGainedClicks: 4321.0,
    massGainedPassive: 999999.0,
    massGainedAuto: 230247.89,
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
// 1. Round-trip parity (canonical carry names; v5)
// -----------------------------------------------------------------------
{
  const live = syntheticLiveState();
  const payload = save.serializeState(live, { lastTier: 3 });

  check('round-trip: version is 5',         eq(payload.version, SAVE_VERSION) && eq(payload.version, 5));
  check('round-trip: schemaSig present', typeof payload.schemaSig === 'string' && payload.schemaSig.length > 0);
  check('round-trip: savedAt present',  typeof payload.savedAt === 'number' && payload.savedAt > 0);
  check('round-trip: mass',             close(payload.game.mass, live.mass));
  check('round-trip: consolidation',    close(payload.game.consolidation, live.consolidation));
  check('round-trip: currentTier',      eq(payload.game.currentTier, live.currentTier));
  check('round-trip: levels count',     eq(Object.keys(payload.game.levels).length, Object.keys(live.levels).length));
  check('round-trip: levels[SW]',       eq(payload.game.levels['Solar Wind'], live.levels['Solar Wind']));
  check('round-trip: levels[HII]',      eq(payload.game.levels['HII Region'], live.levels['HII Region']));

  // Canonical carry names round-trip natively — no relic translation (§4.6).
  check('round-trip: carry.allMps',   close(payload.game.carry.allMps, live.carry.allMps));
  check('round-trip: carry.allMpc',   close(payload.game.carry.allMpc, live.carry.allMpc));
  check('round-trip: carry.carryMps', close(payload.game.carry.carryMps, live.carry.carryMps));
  check('round-trip: carry.carryMpc', close(payload.game.carry.carryMpc, live.carry.carryMpc));
  check('round-trip: carry.carryAps', close(payload.game.carry.carryAps, live.carry.carryAps));

  check('round-trip: consolidationThreshold', close(payload.game.consolidationThreshold, live.consolidationThreshold));
  check('round-trip: totalClicks',       eq(payload.game.totalClicks, live.totalClicks));
  check('round-trip: sessionStart',      eq(payload.game.sessionStart, live.sessionStart));
  check('round-trip: totalPausedMs',     eq(payload.game.totalPausedMs, live.totalPausedMs));
  check('round-trip: tickCount',         eq(payload.game.tickCount, live.tickCount));
  check('round-trip: massGainedClicks',  close(payload.game.massGainedClicks, live.massGainedClicks));
  check('round-trip: massGainedPassive', close(payload.game.massGainedPassive, live.massGainedPassive));
  check('round-trip: massGainedAuto',    close(payload.game.massGainedAuto, live.massGainedAuto));

  check('round-trip: tierSnapshots length', eq(payload.game.tierSnapshots.length, live.tierSnapshots.length));
  check('round-trip: tierSnapshots[0].thresholdHitMs',
    eq((payload.game.tierSnapshots[0] as Any).thresholdHitMs, live.tierSnapshots[0].thresholdHitMs));
  check('round-trip: tierSnapshots[1].levelsAtEnd[SK]',
    eq(payload.game.tierSnapshots[1].levelsAtEnd!['Stellar Kinematics'],
       live.tierSnapshots[1].levelsAtEnd['Stellar Kinematics']));

  // Transient fields must NOT appear in the payload.
  check('round-trip: log not persisted',         !('log' in payload.game));
  check('round-trip: clickTimestamps not persisted', !('clickTimestamps' in payload.game));
  check('round-trip: paused not persisted',      !('paused' in payload.game));

  // meta fields land on the v5 meta block ({ appBuild, lastTier }).
  check('round-trip: meta.lastTier', eq(payload.meta.lastTier, 3));
  check('round-trip: meta.appBuild', eq(payload.meta.appBuild, 'scaffold-v0.1'));

  // Deserialize and verify reconstitution of the canonical payload shape.
  const restored = save.deserializeState(JSON.parse(JSON.stringify(payload))) as Any;
  check('deserialize: shape returns game', restored && !!restored.game);
  check('deserialize: mass round-trip',    close(restored.game.mass, live.mass));
  check('deserialize: consolidation round-trip', close(restored.game.consolidation, live.consolidation));
  check('deserialize: levels[SW] round-trip', eq(restored.game.levels['Solar Wind'], 17));
  check('deserialize: carry.allMps round-trip', close(restored.game.carry.allMps, live.carry.allMps));
  check('deserialize: carry.carryMps round-trip (canonical, native)', close(restored.game.carry.carryMps, live.carry.carryMps));
  check('deserialize: tierSnapshots round-trip', eq(restored.game.tierSnapshots.length, 3));
  check('deserialize: schemaSigCurrent computed', typeof restored.schemaSigCurrent === 'string' && restored.schemaSigCurrent.length > 0);
  check('deserialize: schemaSigMismatch false on identical UPGRADES', eq(restored.schemaSigMismatch, false));
}

// -----------------------------------------------------------------------
// 2. schemaSig stability + sensitivity
// -----------------------------------------------------------------------
{
  const sig = save.computeSchemaSig(UPGRADES);
  check('schemaSig: nonempty for real UPGRADES', typeof sig === 'string' && sig.length > 0);

  const sig2 = save.computeSchemaSig(UPGRADES);
  check('schemaSig: stable across calls', eq(sig, sig2));

  const swapped = UPGRADES.slice();
  const tmp = swapped[0]; swapped[0] = swapped[1]; swapped[1] = tmp;
  const sigSwapped = save.computeSchemaSig(swapped);
  check('schemaSig: differs when order changes', sig !== sigSwapped);

  const renamed = UPGRADES.slice();
  renamed[0] = Object.assign({}, renamed[0], { name: renamed[0].name + ' (renamed)' });
  const sigRenamed = save.computeSchemaSig(renamed);
  check('schemaSig: differs when name changes', sig !== sigRenamed);

  check('schemaSig: empty array -> "empty"', eq(save.computeSchemaSig([]), 'empty'));
}

// -----------------------------------------------------------------------
// 3. Version handling (clean break: v5 native, anything != 5 refused)
// -----------------------------------------------------------------------
{
  const live = syntheticLiveState();
  const payload = save.serializeState(live);

  // v5 payload loads natively.
  const v5Result = save.deserializeState(JSON.parse(JSON.stringify(payload))) as Any;
  check('version: v5 payload loads (game present)', v5Result && !!v5Result.game);

  // Future-version (>5) payload refused.
  const futurePayload = JSON.parse(JSON.stringify(payload));
  futurePayload.version = SAVE_VERSION + 1;
  const futureResult = save.deserializeState(futurePayload) as Any;
  check('version: >5 (future) payload refused',
    futureResult && futureResult.error === 'newer_save_version');

  // Pre-v5 (<5) payloads refused — the clean break abandons the prototype's
  // v1-v4 lineage. Spot-check v1 and v4 (the prototype's first and last).
  for (const v of [1, 4]) {
    const oldPayload = JSON.parse(JSON.stringify(payload));
    oldPayload.version = v;
    const oldResult = save.deserializeState(oldPayload) as Any;
    check('version: <5 payload (v' + v + ') refused',
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
  payload.schemaSig = 'deadbeef';
  const restored = save.deserializeState(payload) as Any;
  check('schemaSigMismatch: payload still loads', restored && !!restored.game);
  check('schemaSigMismatch: flag set true', restored && restored.schemaSigMismatch === true);
}

// -----------------------------------------------------------------------
// 5. JSON round-trip is byte-identical (no NaN / undefined leaks)
// -----------------------------------------------------------------------
{
  const live = syntheticLiveState();
  const payload = save.serializeState(live);
  let json: string | null;
  try { json = JSON.stringify(payload); }
  catch { json = null; }
  check('JSON: serialize succeeds', typeof json === 'string' && json.length > 0);
  const reparsed = json ? JSON.parse(json) : null;
  check('JSON: reparsed.game.mass matches', reparsed && close(reparsed.game.mass, live.mass));
  check('JSON: reparsed.game.levels[SW] matches', reparsed && eq(reparsed.game.levels['Solar Wind'], 17));
}

// -----------------------------------------------------------------------
// 6. Token codec round-trip (encodeToken / decodeToken; §4.1 barrel surface)
// -----------------------------------------------------------------------
{
  const live = syntheticLiveState();
  const payload = save.serializeState(live);
  const token = save.encodeToken(payload);
  check('token: encodes to DF5.<b64>.<crc>', typeof token === 'string' && token.indexOf('DF5.') === 0 && token.split('.').length === 3);
  const decoded = save.decodeToken(token);
  check('token: decodes back', decoded != null);
  check('token: decoded mass matches', !!decoded && close(decoded.game.mass, live.mass));
  check('token: decoded levels[SW] matches', !!decoded && eq(decoded.game.levels['Solar Wind'], 17));
  check('token: tampered token rejected (crc mismatch)',
    save.decodeToken('DF5.' + token.split('.')[1] + '.deadbeef') === null);
  check('token: wrong prefix rejected', save.decodeToken('DF4.abc.def') === null);
  check('token: malformed (not 3 parts) rejected', save.decodeToken('garbage') === null);
}

// -----------------------------------------------------------------------
// §12.6 guard: no relic carry names leak into any v5 fixture.
// -----------------------------------------------------------------------
{
  const live = syntheticLiveState();
  const payload = save.serializeState(live);
  const json = JSON.stringify(payload);
  check('§12.6: no mpsFloor in v5 fixture', json.indexOf('mpsFloor') === -1);
  check('§12.6: no mpcFloor in v5 fixture', json.indexOf('mpcFloor') === -1);
  check('§12.6: no apsFloor in v5 fixture', json.indexOf('apsFloor') === -1);
}

// -----------------------------------------------------------------------
// Surface every collected check as a Vitest test + assert the (new) count.
// -----------------------------------------------------------------------
describe('save_migration (ported, clean-break v5; count differs from prototype 56)', () => {
  it('runs exactly 66 checks (clean-break delta from prototype 56 — see file header)', () => {
    expect(RESULTS.length).toBe(66);
  });
  it.each(RESULTS.map((r, i) => [i, r] as const))('%i: %o', (_i, r) => {
    expect(r.ok, r.name + (r.detail ? '  — ' + r.detail : '')).toBe(true);
  });
});
