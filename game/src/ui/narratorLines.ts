// ui/narratorLines.ts — authored tier-up lines (scaffold §11: no NEW authoring).
//
// Tier-up lines that are ALREADY LOCKED in the design corpus (voice-samples.md /
// CLAUDE.md state-of-play). These relocate verbatim into the fading NarratorSurface
// register. Tiers without a locked line render NOTHING — we do not invent prose
// (v0.1 is not a content pass, §11). First-purchase lines are NOT here: they come
// from the engine's authored `desc` / `descByLevel` fields via getUpgradeFlavor.
//
// These are narrator register ("we") — the fading prose voice. The clinical
// chrome never carries them.

// Keyed by the tier the player ARRIVES at (the toTier of a tier-up).
export const TIER_UP_LINES: Record<number, string> = {
  // T2 Stellar Neighborhood — locked, voice-samples.md §T2 (2026-05-13).
  2:
    'A scattering of stars finds us. ' +
    'A thousand solar masses, gathered. ' +
    'We are no longer just one sun.',
  // T3 Dwarf Spheroidal — locked Candidate 1, "embedding" register (2026-05-13).
  3:
    'We are inside something we cannot see. ' +
    'The stars we can count are the small part. ' +
    'The rest holds.',
  // T4+ tier-up lines are TO-WRITE (writing backlog) — intentionally absent so
  // the surface renders nothing rather than inventing a line.
};

export function tierUpLineFor(toTier: number): string | null {
  return TIER_UP_LINES[toTier] ?? null;
}
