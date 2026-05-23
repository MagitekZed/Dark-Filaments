// dev/devActions.ts — typed dev-only Worker action senders (scaffold §3 / §10).
//
// A thin seam over engineClient's dev wrappers so the dev panel never reaches
// for the raw `send` API and the profile-param mapping for FastForward lives in
// one place. This whole module is import.meta.env.DEV-only by virtue of being
// imported solely from dev/ components; it tree-shakes out of the production
// bundle alongside the rest of dev/.
//
// All five dev tools map onto Worker actions per the §10 dev-tooling table:
//   TierSkip       → SKIP_TO_TIER
//   FastForward    → TIME_SKIP (via the engine's reconstructFromOfflineWindow)
//   ParamOverrides → SET_PARAMS
//   SnapshotInspector → none (reads the store)
//   SceneSwitcher  → none (devSlice.forcedTier / freeOrbit, local store state)
//
// TIME_SKIP is the patient-universe carve-out: it advances mass through the
// SAME reconstructFromOfflineWindow the boot/offline path uses, never an ad-hoc
// multiplier. Pure-idle (allowPurchases:false) accrues at current rates with no
// purchases; with-auto-buy (allowPurchases:true) runs strategy.decideAction with
// a buyer profile so the dev can fast-forward real tier progression.

import {
  sendSkipToTier,
  sendTimeSkip,
  sendSetParams,
  sendPause,
  sendSetTickHz,
} from '../workers/engineClient';
import { DEFAULT_CORE_HZ, DEFAULT_SNAPSHOT_HZ } from '../workers/protocol';
import { resetUniverse } from '../store/persistence';
import { BUYER_PROFILES, type BuyerProfile } from '../engine/profiles';
import type { Params } from '../engine';
// ProfileParams is in engine/types but not in the public barrel (the barrel is
// the Worker/harness surface). The dev layer imports it directly — the barrel
// restriction guards engine purity (engine importing outward), not consumers.
import type { ProfileParams } from '../engine/types';

export type { BuyerProfile };
export { BUYER_PROFILES };

// Duration presets for FastForward (label → seconds).
export const TIME_SKIP_PRESETS: ReadonlyArray<{ label: string; seconds: number }> = [
  { label: '1 hour', seconds: 3600 },
  { label: '6 hours', seconds: 6 * 3600 },
  { label: '1 day', seconds: 24 * 3600 },
  { label: '1 week', seconds: 7 * 24 * 3600 },
];

// ── TierSkip ────────────────────────────────────────────────────────────
export function devSkipToTier(tier: number): void {
  sendSkipToTier(tier);
}

// ── FastForward ───────────────────────────────────────────────────────────
//
// Pure-idle: accrue mass at current rates over `seconds`, no purchases. cpm 0 so
// no click income (the player is away), allowPurchases false so consolidation
// never advances (the universe is patient — purchase is the only way to convert
// stored mass into structural progress).
export function devTimeSkipIdle(seconds: number): void {
  const profileParams: ProfileParams = {
    cpm: 0,
    allowPurchases: false,
  };
  sendTimeSkip(seconds, profileParams);
}

// With-auto-buy: run strategy.decideAction over the window using a buyer profile
// so the dev fast-forwards REAL tier progression (purchases + tier transitions).
// `cpm` lets the dev simulate active play during the skip; default 0 = idle
// purchasing off accrued mass only. mode comes from the buyer profile's path.
export function devTimeSkipAutoBuy(
  seconds: number,
  buyerKey: string,
  cpm = 0,
): void {
  const buyer: BuyerProfile | undefined = BUYER_PROFILES[buyerKey];
  const profileParams: ProfileParams = {
    cpm,
    allowPurchases: true,
    mode: buyer?.path ?? 'completion',
    saveVpcThreshold: buyer?.saveVpcThreshold ?? 1.5,
  };
  sendTimeSkip(seconds, profileParams);
}

// ── ParamOverrides ──────────────────────────────────────────────────────
export function devSetParams(patch: Partial<Params>): void {
  sendSetParams(patch);
}

// ── Restart (fresh universe) ──────────────────────────────────────────────
//
// Re-INIT the live worker with a fresh T1 universe (state:null) and clear the
// save — the SAME INIT path boot uses, so the reset is realistic, not a cheat.
// Store-side resets (the dev session clock, param-patch display, camera readout,
// live-speed) are done by the caller (the React Restart control).
export function devResetUniverse(): void {
  resetUniverse();
}

// ── Live speed (watch a tier unfold, accelerated) ─────────────────────────
//
// Multiplies the core tick rate via SET_TICK_HZ. multiplier 1 = real-time 1 Hz;
// 10 = ten in-game seconds per real second, etc. Honors the rules — the engine
// ticks the SAME applyTick, just more often; income/consolidation accrue exactly
// as in real play. Snapshot cadence stays at the default (UI updates ~4 Hz while
// sim races). NOTE: tabbing away resets cadence to 1× via the visibilitychange
// handler — re-select a speed on return.
export function devSetSpeed(multiplier: number): void {
  const m = Number.isFinite(multiplier) && multiplier > 0 ? multiplier : 1;
  sendSetTickHz(DEFAULT_CORE_HZ * m, DEFAULT_SNAPSHOT_HZ);
}

// ── Auto-click (simulate a player tapping, hands-free) ────────────────────
//
// Drives the worker-runtime autoclicker (off in shipped play) at `cpm` clicks/
// minute through the SAME mpc channel a real tap uses — realistic, just
// hands-free. on=false stops it.
export function devSetAutoClick(on: boolean, cpm: number): void {
  sendSetParams({ autoclickerOn: on, autoCpm: cpm });
}

// ── Auto-buy / self-play (live) ───────────────────────────────────────────
//
// Runs the buyer strategy on the LIVE tick so the game plays itself in real time
// (or at Live speed). Same strategy the fast-forward auto-buy uses — purchases
// and tier transitions fire as in a real climb. Pair with Auto-click for income.
export function devSetAutoBuy(on: boolean, mode: 'completion' | 'threshold'): void {
  sendSetParams({ autoBuyOn: on, autoBuyMode: mode });
}

// ── Pause (shared affordance, exposed for the dev panel) ──────────────────
export function devSetPause(paused: boolean): void {
  sendPause(paused);
}
