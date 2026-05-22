// workers/protocol.ts — the shared Worker postMessage contract (scaffold §4.3).
//
// Imported by BOTH engine.worker.ts (the worker) and engineClient.ts (the
// main-thread client) so the message contract cannot drift between them. This
// module declares only TYPES (and re-exports the engine's Action/Snapshot
// types), so it compiles cleanly under both the worker tsconfig (WebWorker
// libs, no DOM) and the app tsconfig (DOM libs). The only runtime imports are
// type-only from the engine barrel — engine purity is preserved.
//
// Direction conventions:
//   Action        — main → worker (commands).        (engine/types.ts owns it)
//   WorkerMessage — worker → main (snapshots/events). (declared here)
//
// The engine already defines `Action`, `EngineSnapshot`, and `SavePayloadV5`
// in engine/types.ts (the barrel re-exports them per §4.1). We re-export
// `Action` so both sides import the contract from one place.

import type {
  Action,
  EngineSnapshot,
  SavePayloadV5,
} from '../engine';

export type { Action, EngineSnapshot, SavePayloadV5 };

// Worker → Main. Snapshots flow at snapshotHz; discrete events (TRANSITION,
// PURCHASE_OK, PURCHASE_REJECTED) post immediately, out of snapshot cadence,
// so the scene reacts on the same frame as the player action (§4.3).
export type WorkerMessage =
  | { type: 'SNAPSHOT'; snapshot: EngineSnapshot }
  | { type: 'SAVE'; payload: SavePayloadV5 }
  | { type: 'TRANSITION'; fromTier: number; toTier: number }
  | { type: 'PURCHASE_OK'; upgrade: string; level: number }
  | { type: 'PURCHASE_REJECTED'; upgrade: string; reason: 'unaffordable' | 'maxed' | 'unknown' }
  | { type: 'ERROR'; message: string };

// Cadence defaults (§4.3). Foreground: core 1 Hz, snapshot ~4 Hz. Background
// throttle (set via SET_TICK_HZ on visibilitychange) drops snapshot to 0.2 Hz.
export const DEFAULT_CORE_HZ = 1;
export const DEFAULT_SNAPSHOT_HZ = 4;
export const BACKGROUND_CORE_HZ = 1;
export const BACKGROUND_SNAPSHOT_HZ = 0.2;

// The static Act-1 Causal Connections placeholder. Held constant per the
// load-bearing rule "the hidden number is shown from minute one, unlabeled, and
// does not change during Act 1." The scientifically-sound value is a separate
// TO-DO (scaffold §11); this placeholder matches the T2 UI Test mockup.
export const CAUSAL_CONNECTIONS_PLACEHOLDER = 8419302776043;
