// workers/engineClient.ts — main-thread Worker wrapper (§4.3 / §4.5).
//
// Spawns the engine Worker (Vite ES-worker pattern), forwards Action commands,
// and routes WorkerMessages into the Zustand store:
//   SNAPSHOT            → store.applySnapshot (drops stale seq)
//   TRANSITION          → store.setTransition (scene cinematic hook)
//   PURCHASE_OK         → no-op for state (the SNAPSHOT that follows reconciles
//                         the authoritative mass/level); kept for scene markers
//   PURCHASE_REJECTED   → store.setRejection (UI feedback)
//   SAVE                → forwarded to a registered save handler (G3 persistence)
//   ERROR               → console.error
//
// The store is the ONLY thing the scene/UI read — they never touch this client
// directly except through the thin send wrappers (sendClick, sendBuy, …).
//
// Optimistic click (§12.2): sendClick reflects mpc into the store IMMEDIATELY
// (off the latest snapshot's mpc) so the counter rises with zero latency, then
// posts CLICK to the worker for authoritative accrual.

import { storeApi } from '../store';
import type { Action } from '../engine';
import type { WorkerMessage, SavePayloadV5 } from './protocol';

type SaveHandler = (payload: SavePayloadV5) => void;

let worker: Worker | null = null;
let saveHandler: SaveHandler | null = null;

// Spawn (or return the existing) Worker. Idempotent — calling start() twice
// reuses the live worker.
export function startEngine(): Worker {
  if (worker) return worker;
  worker = new Worker(new URL('./engine.worker.ts', import.meta.url), { type: 'module' });
  worker.onmessage = (ev: MessageEvent<WorkerMessage>) => routeMessage(ev.data);
  worker.onerror = (ev) => {
    console.error('[engineClient] worker error:', ev.message);
  };
  return worker;
}

export function stopEngine(): void {
  if (worker) {
    worker.terminate();
    worker = null;
  }
}

// Register a handler for SAVE replies (persistence.ts owns localStorage I/O on
// the main thread — the Worker only produces the payload, §12.5).
export function onSave(handler: SaveHandler): void {
  saveHandler = handler;
}

function routeMessage(msg: WorkerMessage): void {
  const store = storeApi.getState();
  switch (msg.type) {
    case 'SNAPSHOT':
      store.applySnapshot(msg.snapshot);
      break;
    case 'TRANSITION':
      store.setTransition({ fromTier: msg.fromTier, toTier: msg.toTier });
      break;
    case 'PURCHASE_OK':
      // The authoritative SNAPSHOT posted alongside reconciles mass/level. This
      // event is retained for the scene's named-one-shot marker timing (it fires
      // out of snapshot cadence). No store mutation needed here.
      break;
    case 'PURCHASE_REJECTED':
      store.setRejection({ upgrade: msg.upgrade, reason: msg.reason });
      break;
    case 'SAVE':
      if (saveHandler) saveHandler(msg.payload);
      break;
    case 'ERROR':
      console.error('[engineClient] engine error:', msg.message);
      break;
    default: {
      const _exhaustive: never = msg;
      void _exhaustive;
    }
  }
}

// Low-level send. Spawns the worker lazily if needed.
export function send(action: Action): void {
  const w = startEngine();
  w.postMessage(action);
}

// ---- Typed convenience wrappers --------------------------------------------

export function sendInit(initAction: Extract<Action, { type: 'INIT' }>): void {
  send(initAction);
}

// sendClick — the optimistic tap path. Reflects mpc into the store first (zero
// latency), then posts CLICK for authoritative accrual. mpc is read from the
// latest snapshot; if no snapshot yet, reflect 0 (no visible change) but still
// post the click so it is not lost.
export function sendClick(count = 1): void {
  const store = storeApi.getState();
  const mpc = store.snapshot?.mpc ?? 0;
  if (mpc > 0) store.reflectClick(mpc * count);
  send({ type: 'CLICK', count });
}

export function sendBuy(upgrade: string): void {
  // BUY does NOT optimistically decrement mass (§12.2) — it waits for the
  // authoritative snapshot, so the spend always comes from the worker.
  send({ type: 'BUY', upgrade });
}

export function sendTierUp(): void {
  send({ type: 'TIER_UP' });
}

export function sendSetParams(patch: Extract<Action, { type: 'SET_PARAMS' }>['patch']): void {
  send({ type: 'SET_PARAMS', patch });
}

export function sendPause(paused: boolean): void {
  send({ type: 'PAUSE', paused });
}

export function sendRequestSave(): void {
  send({ type: 'REQUEST_SAVE' });
}

export function sendSetTickHz(coreHz: number, snapshotHz: number): void {
  send({ type: 'SET_TICK_HZ', coreHz, snapshotHz });
}

// Dev-only.
export function sendSkipToTier(tier: number): void {
  send({ type: 'SKIP_TO_TIER', tier });
}

export function sendTimeSkip(seconds: number, profileParams: Extract<Action, { type: 'TIME_SKIP' }>['profileParams']): void {
  send({ type: 'TIME_SKIP', seconds, profileParams });
}
