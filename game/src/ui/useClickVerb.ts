// ui/useClickVerb.ts — the clinical click-verb hook + verb map (scaffold §3 G5).
//
// CLINICAL register (Two-voice UI rule): the click verb is a physics label for
// what the tap does — Pull / Bind / Consolidate / Hold / Reach — rotating by
// act/scale across the arc. NOT narrator voice; no "we", no "you", no
// editorializing. Real physics actions, not invented vocabulary.
//
// Lives in its own module so ClickVerb.tsx exports only its component (fast-
// refresh: components and hooks/constants do not share a file).

import { useStore } from '../store';
import { selectTier } from '../store/selectors';

// Tier → clinical verb. Pull at the smallest scale (drawing matter inward),
// through Bind / Consolidate / Hold, to Reach at cosmological scale. The exact
// per-tier assignment is an authoring detail that can refine later; these are
// the load-bearing five clinical verbs, in arc order.
export function verbForTier(tier: number): string {
  if (tier <= 2) return 'Pull';        // Solar System / Stellar Neighborhood
  if (tier <= 4) return 'Bind';        // Dwarf Spheroidal / Galactic Arm
  if (tier <= 6) return 'Consolidate'; // Galaxy / Local Group (peak)
  if (tier <= 9) return 'Hold';        // Galactic Cluster .. Filament
  return 'Reach';                      // Cosmic Web / Causal Horizon
}

export function useClickVerb(): string {
  const tier = useStore(selectTier);
  return verbForTier(tier);
}
