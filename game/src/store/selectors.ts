// store/selectors.ts — narrow selectors (§4.5).
//
// Components subscribe with useStore(selectMass) etc. — narrow slices, no
// whole-snapshot subscriptions, so an engine tick that changes mass does not
// re-render the upgrade sheet.
//
// Optimistic-click reconciliation (§12.2): selectMass takes max(optimisticMass,
// snapshot.mass). The optimistic value (bumped on each click) keeps the counter
// instant; when the next authoritative snapshot's mass catches up or exceeds it,
// selectMass falls back to authoritative — and because we take the MAX it never
// jumps backward (a buy's mass spend lands in the authoritative snapshot, but
// the displayed value only drops once the optimistic value has been overtaken
// — see note below).

import type { GameStore } from './index';

// Mass: never jumps backward from a click. NOTE on buy interaction (§12.2):
// optimisticMass is monotonic and reflects only clicks. After a BUY the
// authoritative snapshot.mass drops by the cost; selectMass keeps showing the
// (higher) optimisticMass until the authoritative value, growing via passive
// income + further clicks reflected into optimisticMass, overtakes it. In
// practice optimisticMass is reset to track the authoritative value on the next
// reflectClick (it rebases off max(optimistic, authoritative)), so a buy
// followed by a click reconciles immediately. Between a buy and the next click,
// the counter holds steady rather than dropping — acceptable and on-theme (the
// mass you spent is gone, but the counter does not flicker down mid-tap).
export const selectMass = (s: GameStore): number => {
  const authoritative = s.snapshot?.mass ?? 0;
  return s.optimisticMass > authoritative ? s.optimisticMass : authoritative;
};

// ZUSTAND v5 GOTCHA (load-bearing for every consumer): selectors that BUILD a
// new object/array each call (selectRates, selectConsolidation) — and the
// null-fallback ones that mint a fresh {} / [] when snapshot is null
// (selectLevels, selectAffordable) — MUST be consumed via useShallow:
//   const rates = useStore(useShallow(selectRates));
// A bare useStore(selectRates) returns an unstable reference each render and
// trips React's "getSnapshot should be cached to avoid an infinite loop", which
// crashes the render. Primitive selectors (selectMass/Tier/CausalConnections/
// Paused) are safe bare. This applies to the G5 chrome too.
export const selectRates = (s: GameStore): { mps: number; mpc: number; aps: number } => ({
  mps: s.snapshot?.mps ?? 0,
  mpc: s.snapshot?.mpc ?? 0,
  aps: s.snapshot?.aps ?? 0,
});

export const selectTier = (s: GameStore): number => s.snapshot?.currentTier ?? 1;

export const selectLevels = (s: GameStore): Record<string, number> => s.snapshot?.levels ?? {};

export const selectConsolidation = (s: GameStore): { value: number; threshold: number; ready: boolean } => ({
  value: s.snapshot?.consolidation ?? 0,
  threshold: s.snapshot?.consolidationThreshold ?? 0,
  ready: s.snapshot?.consolidationReady ?? false,
});

export const selectAffordable = (s: GameStore): string[] => s.snapshot?.affordable ?? [];

export const selectCausalConnections = (s: GameStore): number => s.snapshot?.causalConnections ?? 0;

export const selectRecentPurchase = (s: GameStore) => s.snapshot?.recentPurchase ?? null;

export const selectRecentTierUp = (s: GameStore) => s.snapshot?.recentTierUp ?? null;

export const selectOfflineReturn = (s: GameStore) => s.snapshot?.offlineReturn ?? null;

export const selectPaused = (s: GameStore): boolean => s.snapshot?.paused ?? false;

// Total simulated in-game seconds (1 tick = 1 s). Primitive — safe bare.
export const selectSimSeconds = (s: GameStore): number => s.snapshot?.tickCount ?? 0;

// Sim second the current tier began (for the per-tier elapsed timer). Primitive.
export const selectTierStartSec = (s: GameStore): number => s.snapshot?.tierStartSec ?? 0;

// Dev: the SceneSwitcher force-mount tier. null → CosmicCanvas falls back to the
// live engine tier (selectTier). Non-null → CosmicCanvas mounts that tier's
// scene for authoring/inspection without progressing the game. The dev slice is
// only ever set from the import.meta.env.DEV-gated dev route, so in production
// this stays null (the slice still exists in the store shape, harmlessly).
export const selectForcedTier = (s: GameStore): number | null => s.forcedTier;
