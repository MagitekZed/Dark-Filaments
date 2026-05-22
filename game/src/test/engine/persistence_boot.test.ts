// Dark Filaments — persistence boot-decision test (Vitest, node).
//
// Tests ONLY the PURE decideBoot helper (store/persistence.ts) — the
// restore-vs-fresh decision + the capped offline window. The real
// localStorage / visibilitychange / worker wiring is NOT tested here: those
// need a browser (localStorage + page lifecycle do not exist in node) and are
// flagged for browser verification in the G3 task report. The offline-accrual
// MATH itself is already covered by validate_offline.test.ts (including the
// re-INIT handoff parity assertion); this file proves the boot DECISION around
// it.
//
// Scope (scaffold plan §7 G3 test mandate):
//   - a valid v5 save → restore with the correct offlineSec
//   - a version: 4 save → fresh (NO throw — the load-bearing clean break)
//   - a corrupt / missing save → fresh
//   - the offline window is capped at MAX_OFFLINE_SEC
//
// decideBoot takes a RAW save string (or null) + now + maxOfflineSec, so it is
// fully exercisable without a real localStorage.

import { describe, it, expect } from 'vitest';
// Import the PURE boot decision directly from bootDecision.ts — NOT from
// persistence.ts. persistence.ts touches DOM (window/document) + the worker
// client, which the test program (tsconfig.test.json: ES2023 + node, no DOM)
// cannot type-check. bootDecision.ts imports only pure engine code, so the test
// build graph stays DOM-free. (persistence.ts re-exports decideBoot for the
// app's convenience, but the test goes to the source module.)
import { decideBoot, MAX_OFFLINE_SEC } from '../../store/bootDecision';
import * as save from '../../engine/save';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

// A minimal canonical EngineState the serializer accepts. Mirrors a mid-T2
// universe with carry from T1 so the restore path carries real shape.
function syntheticLiveState(): Any {
  return {
    mass: 4321.5,
    consolidation: 1.2,
    currentTier: 2,
    levels: { 'Solar Wind': 17, 'Stellar Kinematics': 9, 'Local Bubble': 4 },
    carry: { allMps: 1.5, allMpc: 1.0, allAps: 1.0, carryMps: 12.3, carryMpc: 0, carryAps: 0 },
    consolidationThreshold: 2.5,
    consolidationHitMs: null,
    totalClicks: 500,
    sessionStart: 1715520000000,
    totalPausedMs: 0,
    massGainedClicks: 100,
    massGainedPassive: 4000,
    massGainedAuto: 221.5,
    tickCount: 3600,
    tierSnapshots: [
      { tier: 1, startMs: 0, thresholdHitMs: 280000, endMs: 480000, levelsAtEnd: { 'Solar Wind': 12 }, massAtEnd: 980, consolidationHitMs: 280000 },
      { tier: 2, startMs: 480000, thresholdHitMs: null, endMs: null, levelsAtEnd: null, massAtEnd: null, consolidationHitMs: null },
    ],
  };
}

// Build a real v5 save STRING (the boundary decideBoot consumes). savedAt is
// stamped by serializeState (Date.now), then overridden so we can control the
// offline gap deterministically.
function v5SaveString(savedAt: number): string {
  const payload = save.serializeState(syntheticLiveState(), { lastTier: 2 });
  payload.savedAt = savedAt;
  return JSON.stringify(payload);
}

describe('persistence.decideBoot — restore vs fresh', () => {
  // -------------------------------------------------------------------------
  // Valid v5 save → restore with correct offlineSec
  // -------------------------------------------------------------------------
  it('restores a valid v5 save', () => {
    const now = 2_000_000_000_000;
    const savedAt = now - 3600 * 1000; // 1 h ago
    const d = decideBoot(v5SaveString(savedAt), now);
    expect(d.mode).toBe('restore');
    expect(d.state).not.toBeNull();
    expect(d.state!.currentTier).toBe(2);
    expect(d.state!.mass).toBeCloseTo(4321.5, 6);
    expect(d.state!.levels['Solar Wind']).toBe(17);
  });

  it('computes offlineSec from now - savedAt (floored seconds)', () => {
    const now = 2_000_000_000_000;
    const savedAt = now - (1234 * 1000 + 750); // 1234.75 s ago
    const d = decideBoot(v5SaveString(savedAt), now);
    expect(d.mode).toBe('restore');
    expect(d.offlineSec).toBe(1234); // floored
  });

  it('offlineSec is 0 when the save is from the future (no negative window)', () => {
    const now = 2_000_000_000_000;
    const savedAt = now + 60_000; // clock skew: saved 60 s in the "future"
    const d = decideBoot(v5SaveString(savedAt), now);
    expect(d.mode).toBe('restore');
    expect(d.offlineSec).toBe(0);
  });

  // -------------------------------------------------------------------------
  // Offline window capped at MAX_OFFLINE_SEC
  // -------------------------------------------------------------------------
  it('caps the offline window at MAX_OFFLINE_SEC', () => {
    const now = 2_000_000_000_000;
    const savedAt = now - 7 * 24 * 3600 * 1000; // 7 days ago
    const d = decideBoot(v5SaveString(savedAt), now);
    expect(d.mode).toBe('restore');
    expect(d.offlineSec).toBe(MAX_OFFLINE_SEC);
  });

  it('honors a custom maxOfflineSec ceiling', () => {
    const now = 2_000_000_000_000;
    const savedAt = now - 10 * 3600 * 1000; // 10 h ago
    const customCap = 3600; // 1 h
    const d = decideBoot(v5SaveString(savedAt), now, customCap);
    expect(d.offlineSec).toBe(customCap);
  });

  // -------------------------------------------------------------------------
  // version: 4 → fresh (clean break, NO throw) — load-bearing
  // -------------------------------------------------------------------------
  it('starts fresh on a version: 4 save without throwing (clean break)', () => {
    const payload = JSON.parse(v5SaveString(Date.now()));
    payload.version = 4;
    const raw = JSON.stringify(payload);
    let d: ReturnType<typeof decideBoot> | null = null;
    expect(() => { d = decideBoot(raw, Date.now()); }).not.toThrow();
    expect(d).not.toBeNull();
    expect(d!.mode).toBe('fresh');
    expect(d!.state).toBeNull();
    expect(d!.offlineSec).toBe(0);
    expect(d!.reason).toContain('refused');
  });

  it('starts fresh on any version != 5 (v1 and a future version)', () => {
    for (const v of [1, 99]) {
      const payload = JSON.parse(v5SaveString(Date.now()));
      payload.version = v;
      const d = decideBoot(JSON.stringify(payload), Date.now());
      expect(d.mode, 'version ' + v + ' must be fresh').toBe('fresh');
      expect(d.state).toBeNull();
    }
  });

  // -------------------------------------------------------------------------
  // Corrupt / missing → fresh
  // -------------------------------------------------------------------------
  it('starts fresh when no save is present (null)', () => {
    const d = decideBoot(null, Date.now());
    expect(d.mode).toBe('fresh');
    expect(d.state).toBeNull();
    expect(d.reason).toBe('no-save');
  });

  it('starts fresh on corrupt (unparseable) JSON without throwing', () => {
    let d: ReturnType<typeof decideBoot> | null = null;
    expect(() => { d = decideBoot('{not valid json', Date.now()); }).not.toThrow();
    expect(d!.mode).toBe('fresh');
    expect(d!.reason).toBe('corrupt-json');
  });

  it('starts fresh on a malformed payload (no version field)', () => {
    const payload = JSON.parse(v5SaveString(Date.now()));
    delete payload.version;
    const d = decideBoot(JSON.stringify(payload), Date.now());
    expect(d.mode).toBe('fresh');
    expect(d.reason).toBe('malformed');
  });

  it('starts fresh on a non-object JSON payload (string / number)', () => {
    expect(decideBoot('"just a string"', Date.now()).mode).toBe('fresh');
    expect(decideBoot('42', Date.now()).mode).toBe('fresh');
  });
});
