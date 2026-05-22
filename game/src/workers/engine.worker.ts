// workers/engine.worker.ts — the live engine tick loop, impure shell (§4.4).
//
// The Worker holds the ONLY mutable engine state in the running game. It is
// player-driven: BUY is handled directly here (via the pure applyBuy in
// engineCore.ts, validating affordability with core.cost) — strategy.decideAction
// is NOT on this live path. All state mutation goes through the PURE helpers in
// engineCore.ts; this shell owns only the timers + the postMessage channel.
//
// Cadence (§4.3):
//   - Core tick: 1 Hz, driven by a self-correcting accumulator against
//     performance.now() so drift does not accumulate over a long session.
//   - Snapshot post: ~4 Hz, coalesced — posted on a fixed interval while
//     unpaused, plus immediately on any discrete event.
//   - Discrete events (TRANSITION, PURCHASE_OK, PURCHASE_REJECTED) post
//     IMMEDIATELY, out of snapshot cadence (§4.3 / §12.8).
//
// Boundary-second discipline (§4.3 / §12.1): INIT runs the PURE prepareReInit
// helper to accrue the offline window, then resets the tick accumulator to
// `now` so the first live tick lands at the NEXT whole second — the boundary
// second is never double-counted. prepareReInit lives in engineCore.ts and is
// unit-tested directly (Workers do not exist in Node).

import * as offline from '../engine/offline';
import { serializeState } from '../engine/save';
import { DEFAULT_PARAMS } from '../engine/data';
import type { Action, EngineState, Params, Upgrade } from '../engine/types';
import {
  type WorkerMessage,
  DEFAULT_CORE_HZ,
  DEFAULT_SNAPSHOT_HZ,
} from './protocol';
import {
  freshEngineState,
  activeUpgradesFor,
  applyTick,
  applyClick,
  applyBuy,
  applyTierUp,
  applySkipToTier,
  deriveSnapshot,
  prepareReInit,
  mergeParams,
} from './engineCore';

// `self` typed for a module worker. In a real Worker this is the
// DedicatedWorkerGlobalScope; the module is never imported in Node (only
// engineCore.ts's pure helpers are), so this is always a real Worker context.
const ctx = self as unknown as DedicatedWorkerGlobalScope;

interface Runtime {
  state: EngineState;
  params: Params;
  activeUpgrades: Upgrade[];
  paused: boolean;
  seq: number;
  // One-shot snapshot riders, cleared after the next snapshot post.
  recentPurchase: { name: string; tier: number; level: number } | null;
  recentTierUp: { fromTier: number; toTier: number } | null;
  offlineReturn: { elapsedSec: number; massGained: number } | null;
  // Self-correcting accumulator (ms). nextTickAt is the wall-clock target for
  // the next 1 Hz core tick; advanced by exactly coreIntervalMs per applied
  // tick so drift does not accumulate.
  nextTickAt: number;
  coreIntervalMs: number;
  snapshotIntervalMs: number;
  coreHandle: ReturnType<typeof setInterval> | null;
  snapshotHandle: ReturnType<typeof setInterval> | null;
  initialized: boolean;
}

const rt: Runtime = {
  state: freshEngineState(),
  params: Object.assign({}, DEFAULT_PARAMS),
  activeUpgrades: activeUpgradesFor(1),
  paused: false,
  seq: 0,
  recentPurchase: null,
  recentTierUp: null,
  offlineReturn: null,
  nextTickAt: 0,
  coreIntervalMs: 1000 / DEFAULT_CORE_HZ,
  snapshotIntervalMs: 1000 / DEFAULT_SNAPSHOT_HZ,
  coreHandle: null,
  snapshotHandle: null,
  initialized: false,
};

function nowMs(): number {
  return typeof performance !== 'undefined' && performance.now
    ? performance.now()
    : Date.now();
}

function post(msg: WorkerMessage): void {
  ctx.postMessage(msg);
}

function postSnapshot(): void {
  rt.seq += 1;
  const snap = deriveSnapshot(
    rt.state, rt.activeUpgrades, rt.params, rt.seq, rt.paused,
    rt.recentPurchase, rt.recentTierUp, rt.offlineReturn,
  );
  post({ type: 'SNAPSHOT', snapshot: snap });
  // Clear one-shot riders once they have ridden out on a snapshot.
  rt.recentPurchase = null;
  rt.recentTierUp = null;
  rt.offlineReturn = null;
}

// Core tick driver — self-correcting. A fired interval may catch up multiple
// whole seconds if the timer was throttled/coalesced, advancing nextTickAt by
// exactly coreIntervalMs per applied tick. A long backgrounding is NOT trusted
// here (the authoritative path is a re-INIT with offline accrual from the main
// thread, §4.3); catch-up is capped so the worker never spins.
const MAX_CATCHUP_TICKS = 5;

function coreLoop(): void {
  if (rt.paused || !rt.initialized) return;
  const now = nowMs();
  let applied = 0;
  while (now >= rt.nextTickAt && applied < MAX_CATCHUP_TICKS) {
    applyTick(rt.state, rt.activeUpgrades, rt.params);
    rt.nextTickAt += rt.coreIntervalMs;
    applied += 1;
  }
  // Fell far behind (browser froze the worker): snap forward rather than spin.
  if (now > rt.nextTickAt) {
    rt.nextTickAt = now + rt.coreIntervalMs;
  }
}

function startTimers(): void {
  stopTimers();
  // Core loop runs faster than 1 Hz so the accumulator can self-correct; the
  // accumulator gate (now >= nextTickAt) decides when a whole second elapses.
  rt.coreHandle = setInterval(coreLoop, Math.min(rt.coreIntervalMs, 250));
  rt.snapshotHandle = setInterval(() => {
    if (!rt.initialized || rt.paused) return;
    postSnapshot();
  }, rt.snapshotIntervalMs);
}

function stopTimers(): void {
  if (rt.coreHandle != null) { clearInterval(rt.coreHandle); rt.coreHandle = null; }
  if (rt.snapshotHandle != null) { clearInterval(rt.snapshotHandle); rt.snapshotHandle = null; }
}

function buildSavePayload() {
  return serializeState(rt.state, {
    appBuild: 'scaffold-v0.1',
    lastTier: rt.state.currentTier,
  });
}

function handleAction(action: Action): void {
  switch (action.type) {
    case 'INIT': {
      // Boundary-second discipline (§4.3 / §12.1): accrue the offline window via
      // the PURE prepareReInit helper, then reset the accumulator to `now` so
      // the first live tick lands at the NEXT whole second.
      const prepared = prepareReInit(action.state, action.offlineSec);
      rt.state = prepared.state;
      rt.params = mergeParams(DEFAULT_PARAMS, action.params || {});
      rt.activeUpgrades = activeUpgradesFor(rt.state.currentTier);
      rt.coreIntervalMs = 1000 / DEFAULT_CORE_HZ;
      rt.snapshotIntervalMs = 1000 / DEFAULT_SNAPSHOT_HZ;
      rt.nextTickAt = nowMs() + rt.coreIntervalMs;
      rt.offlineReturn = prepared.offlineReturn;
      rt.paused = false;
      rt.initialized = true;
      startTimers();
      // Immediate snapshot so the UI hydrates on boot without waiting for the
      // first interval (and so offlineReturn surfaces at once).
      postSnapshot();
      break;
    }
    case 'BUY': {
      const outcome = applyBuy(rt.state, rt.activeUpgrades, action.upgrade);
      if (outcome.ok) {
        rt.recentPurchase = {
          name: outcome.upgrade,
          tier: rt.state.currentTier,
          level: outcome.level,
        };
        post({ type: 'PURCHASE_OK', upgrade: outcome.upgrade, level: outcome.level });
        postSnapshot();
      } else {
        post({ type: 'PURCHASE_REJECTED', upgrade: outcome.upgrade, reason: outcome.reason });
      }
      break;
    }
    case 'CLICK': {
      const count = action.count != null && action.count > 0 ? action.count : 1;
      applyClick(rt.state, rt.activeUpgrades, rt.params, count);
      // No immediate snapshot — clicks are reflected optimistically on the main
      // thread; the next ~4 Hz snapshot reconciles. Posting per-click would
      // flood the channel during fast tapping.
      break;
    }
    case 'SET_PARAMS': {
      rt.params = mergeParams(rt.params, action.patch || {});
      postSnapshot();
      break;
    }
    case 'TIER_UP': {
      const out = applyTierUp(rt.state);
      if (out.ok) {
        rt.activeUpgrades = activeUpgradesFor(rt.state.currentTier);
        rt.recentTierUp = { fromTier: out.fromTier, toTier: out.toTier };
        post({ type: 'TRANSITION', fromTier: out.fromTier, toTier: out.toTier });
        postSnapshot();
      }
      // gate-closed / max-tier are silent no-ops; the UI gates the affordance.
      break;
    }
    case 'SKIP_TO_TIER': {
      const fromTier = rt.state.currentTier;
      const ok = applySkipToTier(rt.state, action.tier);
      if (ok) {
        rt.activeUpgrades = activeUpgradesFor(rt.state.currentTier);
        rt.recentTierUp = { fromTier, toTier: rt.state.currentTier };
        post({ type: 'TRANSITION', fromTier, toTier: rt.state.currentTier });
        postSnapshot();
      }
      break;
    }
    case 'TIME_SKIP': {
      // Dev fast-forward via the patient-universe accrual path — the same
      // reconstructFromOfflineWindow the boot/offline path uses, with the dev's
      // chosen profile params (allowPurchases per a buyer profile, etc.).
      const result = offline.reconstructFromOfflineWindow(
        rt.state, action.seconds, action.profileParams || {},
      );
      rt.state = result.newState as EngineState;
      rt.activeUpgrades = activeUpgradesFor(rt.state.currentTier);
      rt.nextTickAt = nowMs() + rt.coreIntervalMs;
      postSnapshot();
      break;
    }
    case 'PAUSE': {
      rt.paused = !!action.paused;
      if (!rt.paused) {
        // On resume, reset the accumulator so the paused span is not replayed
        // as backlog ticks.
        rt.nextTickAt = nowMs() + rt.coreIntervalMs;
      }
      postSnapshot();
      break;
    }
    case 'REQUEST_SAVE': {
      post({ type: 'SAVE', payload: buildSavePayload() });
      break;
    }
    case 'SET_TICK_HZ': {
      const coreHz = action.coreHz > 0 ? action.coreHz : DEFAULT_CORE_HZ;
      const snapHz = action.snapshotHz > 0 ? action.snapshotHz : DEFAULT_SNAPSHOT_HZ;
      rt.coreIntervalMs = 1000 / coreHz;
      rt.snapshotIntervalMs = 1000 / snapHz;
      rt.nextTickAt = nowMs() + rt.coreIntervalMs;
      if (rt.initialized) startTimers();
      break;
    }
    default: {
      // Exhaustiveness guard — a new action type without a handler is a build
      // error here.
      const _exhaustive: never = action;
      void _exhaustive;
    }
  }
}

ctx.onmessage = (ev: MessageEvent<Action>) => {
  try {
    handleAction(ev.data);
  } catch (err) {
    post({ type: 'ERROR', message: err instanceof Error ? err.message : String(err) });
  }
};
