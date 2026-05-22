// scene/hooks/useEngineScene.ts — the single selector bundle the scene reads
// (scaffold §3 + §12.7).
//
// This is the ONLY scene→state hook. The scene reads the STORE, never the
// Worker (§12.7) — no scene module imports engineClient. Object/array-returning
// selectors are consumed via useShallow (the load-bearing Zustand v5 guard from
// store/selectors.ts; a bare useStore(objectSelector) trips the "getSnapshot
// should be cached" infinite loop — G2 hit this exact bug).
//
// It returns the slices the scene cares about: current tier (which scene to
// mount), owned upgrade levels (named-one-shot mounts + stackable density),
// and the most recent purchase / tier-up (event hooks for fresh-start markers
// and cinematics).

import { useShallow } from 'zustand/react/shallow';
import { useStore } from '../../store';
import {
  selectTier,
  selectLevels,
  selectRates,
  selectRecentPurchase,
  selectRecentTierUp,
} from '../../store/selectors';

export interface EngineSceneView {
  tier: number;
  levels: Record<string, number>;
  rates: { mps: number; mpc: number; aps: number };
  recentPurchase: { name: string; tier: number; level: number } | null;
  recentTierUp: { fromTier: number; toTier: number } | null;
}

export function useEngineScene(): EngineSceneView {
  // Primitive selector — safe bare.
  const tier = useStore(selectTier);
  // Object/array selectors — MUST be useShallow (Zustand v5 guard).
  const levels = useStore(useShallow(selectLevels));
  const rates = useStore(useShallow(selectRates));
  const recentPurchase = useStore(useShallow(selectRecentPurchase));
  const recentTierUp = useStore(useShallow(selectRecentTierUp));

  return { tier, levels, rates, recentPurchase, recentTierUp };
}

// Convenience: just the tier (the CosmicCanvas mount decision). Primitive,
// safe bare.
export function useSceneTier(): number {
  return useStore(selectTier);
}

// Convenience: owned upgrade levels (the density + named-one-shot hooks). Must
// be useShallow.
export function useSceneLevels(): Record<string, number> {
  return useStore(useShallow(selectLevels));
}
