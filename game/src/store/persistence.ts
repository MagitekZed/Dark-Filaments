// store/persistence.ts — the persistence lifecycle (scaffold plan §7 G3 / §4.6 / §12.5).
//
// MAIN-THREAD ONLY. This is the SINGLE module in game/ that touches
// localStorage (§12.5 ownership rule). The Worker never reads or writes
// localStorage — it only PRODUCES a SavePayloadV5 (REQUEST_SAVE → SAVE) and
// CONSUMES one (INIT.state). persistence.ts is the bridge:
//
//   boot()        read localStorage → decide restore-vs-fresh → INIT the worker
//                 with the offline-accrual window (pure-idle) before ticking.
//   autosave      10 s interval → requestSave() → on the worker's SAVE reply,
//                 write the payload to localStorage.
//   beforeunload  flush a save synchronously on tab close / refresh.
//   tier-up       save immediately when the tier changes (the carry recompose
//                 is the most valuable thing to not lose).
//   visibility    on long backgrounding (> threshold), re-INIT the worker with
//                 the elapsed-window offline accrual — the SAME boundary-second
//                 path as boot — rather than trust the throttled tick across a
//                 frozen hidden window (§4.3 / §12.1).
//
// The pure decision logic (decideBoot) is factored out so it is unit-testable in
// Node without a real localStorage; the impure getItem/setItem/visibility
// wiring is thin and untested-in-Node (it needs a browser — flagged in the
// task report).

import { DEFAULT_PARAMS } from '../engine';
import type { EngineState, Params, SavePayloadV5 } from '../engine';
import {
  readLocalSave,
  writeLocalSave,
  clearLocalSave,
} from '../engine/save';
import {
  startEngine,
  onSave,
  sendInit,
  sendRequestSave,
  sendSetTickHz,
} from '../workers/engineClient';
import { storeApi } from './index';
import {
  DEFAULT_CORE_HZ,
  DEFAULT_SNAPSHOT_HZ,
  BACKGROUND_CORE_HZ,
  BACKGROUND_SNAPSHOT_HZ,
} from '../workers/protocol';
// The PURE boot decision lives in bootDecision.ts (no DOM / worker / localStorage)
// so it is Node-testable in isolation; persistence.ts (this file) owns the impure
// lifecycle around it.
import { decideBoot, MAX_OFFLINE_SEC, type BootDecision } from './bootDecision';

export { decideBoot, MAX_OFFLINE_SEC };
export type { BootDecision };

// Autosave cadence (§7 G3).
export const AUTOSAVE_INTERVAL_MS = 10_000; // 10 s

// visibilitychange re-INIT threshold (§4.3): below this, the throttled tick is
// trusted for smoothness; above it, the worker may have been frozen by the
// browser, so re-INIT with offline accrual is the authoritative path.
export const VISIBLE_REINIT_THRESHOLD_SEC = 60; // 60 s hidden → re-INIT on return

// ---------------------------------------------------------------------------
// Impure lifecycle — main thread; the only localStorage I/O in game/.
// ---------------------------------------------------------------------------

let booted = false;
let autosaveHandle: ReturnType<typeof setInterval> | null = null;
let lastSeenTier = 1;
let hiddenAtMs: number | null = null;
let listenersBound = false;
// Tracks the engine params currently in force (so re-INIT after a hidden
// window reuses them rather than resetting to DEFAULT_PARAMS).
let activeParams: Params = Object.assign({}, DEFAULT_PARAMS);

// Read the raw save string from localStorage. Thin impure wrapper; the pure
// decideBoot does the rest. Uses save.ts's readLocalSave (which already guards
// `typeof localStorage` + try/catch), then re-stringifies so decideBoot's pure
// signature (raw string) holds — readLocalSave already parses, so we round-trip
// to keep the boundary honest and corrupt-handling testable.
function readRawSave(): string | null {
  const payload = readLocalSave();
  if (payload == null) return null;
  try {
    return JSON.stringify(payload);
  } catch {
    return null;
  }
}

// boot — the entry point. Idempotent (guards against StrictMode double-mount).
// Reads the save, decides restore-vs-fresh, spawns the worker, registers the
// SAVE handler, INITs with the offline window, and binds the lifecycle
// listeners + autosave interval. Returns the decision (handy for tests/logging).
export function boot(now: number = Date.now()): BootDecision {
  if (booted) {
    return { mode: 'fresh', state: null, offlineSec: 0, reason: 'already-booted' };
  }
  booted = true;

  const decision = decideBoot(readRawSave(), now);

  // If a non-v5 / corrupt save was refused, clear the stale blob so the next
  // autosave does not have to overwrite a payload we cannot read (matches the
  // prototype's clearLocalSave-on-refusal behavior).
  if (decision.mode === 'fresh' && decision.reason !== 'no-save') {
    clearLocalSave();
  }

  activeParams = Object.assign({}, DEFAULT_PARAMS);

  startEngine();
  // The worker hands back an authoritative SavePayloadV5 on REQUEST_SAVE; we are
  // the only writer to localStorage (§12.5).
  onSave(handleSave);

  sendInit({
    type: 'INIT',
    state: decision.state,
    params: activeParams,
    offlineSec: decision.offlineSec,
  });

  // Track the tier we boot into so save-on-tier-up has a baseline to diff.
  lastSeenTier = decision.state?.currentTier ?? 1;

  bindLifecycle();
  startAutosave();

  return decision;
}

// handleSave — the worker's SAVE reply. The worker built the payload via
// serializeState (authoritative state); persistence only persists it. This is
// the ONLY place a SavePayloadV5 reaches localStorage.
function handleSave(payload: SavePayloadV5): void {
  writeLocalSave(payload);
}

function startAutosave(): void {
  if (autosaveHandle != null) return;
  autosaveHandle = setInterval(() => {
    sendRequestSave();
  }, AUTOSAVE_INTERVAL_MS);
}

function stopAutosave(): void {
  if (autosaveHandle != null) {
    clearInterval(autosaveHandle);
    autosaveHandle = null;
  }
}

// Subscribe to the store for tier changes → save-on-tier-up. The worker posts a
// TRANSITION (routed into store.lastTransition) AND a snapshot with the new
// currentTier; we diff currentTier so a save fires once per real tier change.
function bindStoreTierWatch(): void {
  storeApi.subscribe((state) => {
    const tier = state.snapshot?.currentTier;
    if (typeof tier === 'number' && tier !== lastSeenTier) {
      lastSeenTier = tier;
      // The carry recompose just landed in the worker's state; capture it.
      sendRequestSave();
    }
  });
}

function bindLifecycle(): void {
  if (listenersBound) return;
  listenersBound = true;

  bindStoreTierWatch();

  // Guard against non-DOM contexts (Node tests never call boot(), but be safe).
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  // Save-on-beforeunload — flush before the tab closes / refreshes. The worker
  // reply is async, so we cannot guarantee the SAVE round-trips before unload;
  // the 10 s autosave already keeps the gap small. We request a save anyway —
  // if the SAVE lands before unload, it persists the freshest state.
  window.addEventListener('beforeunload', () => {
    sendRequestSave();
  });

  // visibilitychange re-INIT (§4.3 / §12.1). On hidden: throttle the tick to
  // spare battery and stamp the hidden timestamp. On visible: if the hidden
  // window was long, re-INIT the worker with the elapsed-window offline accrual
  // (the same boundary-second-safe path as boot — the worker's INIT runs
  // prepareReInit). Otherwise just restore the foreground tick cadence.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      hiddenAtMs = Date.now();
      sendSetTickHz(BACKGROUND_CORE_HZ, BACKGROUND_SNAPSHOT_HZ);
    } else if (document.visibilityState === 'visible') {
      const hiddenFor = hiddenAtMs != null ? Date.now() - hiddenAtMs : 0;
      hiddenAtMs = null;
      const hiddenSec = Math.floor(hiddenFor / 1000);
      if (hiddenSec >= VISIBLE_REINIT_THRESHOLD_SEC) {
        reInitAfterHidden(hiddenSec);
      } else {
        // Short backgrounding: the throttled tick is trusted; just restore
        // the foreground cadence.
        sendSetTickHz(DEFAULT_CORE_HZ, DEFAULT_SNAPSHOT_HZ);
      }
    }
  });
}

// reInitAfterHidden — the long-hidden-window handoff (§4.3 highest-risk path).
// We do NOT trust the throttled tick across a frozen hidden window. Instead we
// re-INIT the worker with the elapsed window as a pure-idle offline accrual —
// the SAME path boot uses (the worker's INIT runs prepareReInit, which resets
// the tick accumulator to `now`, so the boundary second is counted exactly once
// and never double-counted). To get the authoritative pre-hidden state, we ask
// the worker for a SAVE and re-INIT from it once it arrives.
function reInitAfterHidden(hiddenSec: number): void {
  const cappedSec = Math.min(hiddenSec, MAX_OFFLINE_SEC);
  // One-shot SAVE handler: re-INIT from the authoritative payload, then restore
  // the normal SAVE→write handler.
  onSave((payload: SavePayloadV5) => {
    // Persist the pre-hidden state first (so a crash mid-handoff loses nothing).
    writeLocalSave(payload);
    onSave(handleSave);
    sendInit({
      type: 'INIT',
      state: payload.game as EngineState,
      params: activeParams,
      offlineSec: cappedSec,
    });
    // Restore foreground cadence (INIT already resets timers, but be explicit).
    sendSetTickHz(DEFAULT_CORE_HZ, DEFAULT_SNAPSHOT_HZ);
  });
  sendRequestSave();
}

// resetUniverse — DEV-only fresh-start. Clears the save and re-INITs the live
// worker with a fresh T1 universe (state:null) at default params, the same INIT
// path boot uses — so the reset goes through the real engine, no rule-breaking
// shortcut. The worker's INIT swaps rt.state for a fresh one, restarts timers,
// and posts an immediate snapshot, so the store/scene reflect T1 at once. The
// next autosave persists the fresh state (clearLocalSave is belt-and-suspenders
// against a stale blob being restored if the tab is closed before that).
// Leaves the lifecycle listeners + autosave bound (boot already ran).
export function resetUniverse(): void {
  clearLocalSave();
  lastSeenTier = 1;
  activeParams = Object.assign({}, DEFAULT_PARAMS);
  sendInit({
    type: 'INIT',
    state: null,
    params: activeParams,
    offlineSec: 0,
  });
}

// shutdown — tears down the interval + resets the boot guard. Used by tests and
// any future teardown; not called in the normal app lifecycle.
export function shutdown(): void {
  stopAutosave();
  booted = false;
}
