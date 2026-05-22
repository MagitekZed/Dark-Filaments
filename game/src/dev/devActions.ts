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
} from '../workers/engineClient';
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

// ── Pause (shared affordance, exposed for the dev panel) ──────────────────
export function devSetPause(paused: boolean): void {
  sendPause(paused);
}
