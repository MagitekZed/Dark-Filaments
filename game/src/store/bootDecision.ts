// store/bootDecision.ts — the PURE boot-decision logic (scaffold plan §7 G3).
//
// Factored out of persistence.ts so it is unit-testable in Node WITHOUT a real
// localStorage, worker, or DOM. This module imports ONLY pure engine code
// (deserializeState) — no engineClient, no DOM globals (window/document), no
// localStorage. That keeps the test program (tsconfig.test.json: ES2023 + node
// libs, no DOM) able to type-check the persistence test by importing this module
// alone; persistence.ts (which DOES touch DOM + the worker client) is never
// pulled into the test build graph.
//
// The impure lifecycle (localStorage I/O, the worker INIT, visibilitychange,
// autosave) lives in persistence.ts and consumes decideBoot's verdict.

import { deserializeState } from '../engine/save';
import type { EngineState } from '../engine';

// Boot offline cap: a player away for a month should not get a month of accrual
// on the boot path (the prototype caps boot offline at 24 h). This bounds the
// pure-idle window the worker reconstructs before the first live tick.
export const MAX_OFFLINE_SEC = 24 * 60 * 60; // 24 h

export interface BootDecision {
  mode: 'restore' | 'fresh';
  state: EngineState | null; // restore → the saved game state; fresh → null
  offlineSec: number; // pure-idle accrual window to apply on INIT (capped)
  reason: string; // human-readable why (for logging / tests)
}

// decideBoot — the PURE boot decision (§7 G3 step 1). Given the RAW save string
// read from localStorage (or null when absent), `now`, and a max-offline
// ceiling, decide whether to RESTORE the saved universe (with a capped offline
// window) or start a FRESH one. A clean break is load-bearing here: a
// version != 5 save (e.g. the prototype's v4) MUST NOT crash — deserializeState
// returns a refusal object, and we treat it as `fresh` (no throw).
//
//   rawSave == null            → fresh (no save present)
//   unparseable JSON           → fresh (corrupt save)
//   deserialize returns null   → fresh (malformed / no version)
//   deserialize returns error  → fresh (version != 5 — clean break; no migration)
//   deserialize returns game   → restore, offlineSec = clamp(now - savedAt)
export function decideBoot(
  rawSave: string | null,
  now: number = Date.now(),
  maxOfflineSec: number = MAX_OFFLINE_SEC,
): BootDecision {
  if (rawSave == null) {
    return { mode: 'fresh', state: null, offlineSec: 0, reason: 'no-save' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawSave);
  } catch {
    return { mode: 'fresh', state: null, offlineSec: 0, reason: 'corrupt-json' };
  }

  const result = deserializeState(parsed);

  // null → malformed (no object / no version). Fresh, no throw.
  if (result == null) {
    return { mode: 'fresh', state: null, offlineSec: 0, reason: 'malformed' };
  }

  // A refusal carries { error, payload: null } — version != 5 (clean break) or
  // future version. Fresh, no throw. This is the load-bearing "version: 4 must
  // not crash" path.
  if ('error' in result) {
    return { mode: 'fresh', state: null, offlineSec: 0, reason: 'refused:' + result.error };
  }

  // A valid v5 payload: restore with a capped offline window.
  const savedAt = typeof result.savedAt === 'number' ? result.savedAt : now;
  const rawGapSec = Math.max(0, Math.floor((now - savedAt) / 1000));
  const offlineSec = Math.min(rawGapSec, Math.max(0, maxOfflineSec));
  return {
    mode: 'restore',
    state: result.game,
    offlineSec,
    reason: 'restore',
  };
}
