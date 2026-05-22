// scene/hooks/useNamedOneShots.ts — STUB (scaffold §3 + §6.2).
//
// CD-7 (named one-shots are universe events): every named one-shot upgrade
// corresponds to a visible structure that appears in the 3D scene on purchase
// and remains until a named-connection break removes it. This hook wires the
// MECHANISM (purchase a one-shot → its scene component is reported as "should
// mount" with freshStart=true on the purchase frame) and stubs the CONTENT
// (the full per-tier mapping of every one-shot to a bespoke scene component;
// only the handful the spike already built are mapped here).
//
// freshStart pattern (NOTES.md "T2 — UI Test", Wolf-Rayet iteration 2): a
// long-lived particle system that mounts mid-game must start all particles at
// age 0 so they emerge from their start state rather than "popping in" mid-
// lifecycle. The flag flows from here into the scene component on first mount.
//
// Engine-import seam (§4.1): this hook does NOT import UPGRADES from the engine
// barrel — that import is reserved for the Worker + tests. Instead it carries
// its own scene-side catalog of one-shot upgrade NAMES (authoring data the
// scene owns). The catalog is the attach point for later per-tier content.
//
// Reads the STORE only (§12.7) — via useSceneLevels (selectLevels under
// useShallow). No engineClient import.

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSceneLevels } from './useEngineScene';

const EMPTY_NAMES: readonly string[] = [];

// Scene-side one-shot catalog. Keyed by tier; each entry is the set of one-shot
// upgrade names the engine emits in `levels`. A one-shot is owned when its
// level >= 1. Only the names the spike already has (or could trivially get) a
// visual for are listed; the rest attach later. Mirrors the engine data.ts
// one-shots (maxLevels === 1) by name, but is intentionally a separate static
// list so the engine barrel stays unimported here.
export const ONE_SHOT_NAMES: Record<number, string[]> = {
  1: ['Orbital Resonance', 'Heliopause', 'First Photons'],
  2: ['Binary Partner', 'Peculiar Velocity', 'Open Cluster', 'Moving Group'],
  // T3+ one-shots attach as their scenes are authored.
  3: ['Orphan Stream', 'Sculptor Dwarf', 'Draco Dwarf', 'Sagittarius Stream'],
  4: ['Galactic Bulge', 'Sagittarius B2', 'Globular Cluster', 'Active Nucleus'],
  5: ['Bar Structure', 'Fermi Bubbles', 'Sagittarius A*', 'Hot Coronal Halo', 'Dark Matter Halo'],
};

export interface OneShotMount {
  /** The one-shot upgrade name (which scene marker to mount). */
  name: string;
  /** True only on the frame the one-shot was newly purchased — drives the
   *  fresh-start activation (particles from age 0, sequenced ignition, etc.).
   *  False for one-shots restored from a save (they were always there). */
  freshStart: boolean;
}

// Returns the list of owned one-shots for the current tier, each flagged with
// whether it was just purchased this session (freshStart) vs restored/already
// owned. Scene components consume `freshStart` to pick the activation envelope.
export function useNamedOneShots(tier: number): OneShotMount[] {
  const levels = useSceneLevels();
  // Stable per-tier name list — avoids the `?? []` minting a fresh array each
  // render (which would re-fire the effect every render).
  const names = useMemo(() => ONE_SHOT_NAMES[tier] ?? EMPTY_NAMES, [tier]);

  // Track which one-shots we have already reported as mounted, so a newly-owned
  // one fires freshStart exactly once. Reset when the tier changes.
  const seenRef = useRef<Set<string>>(new Set());
  const lastTierRef = useRef<number>(tier);
  const [mounts, setMounts] = useState<OneShotMount[]>([]);

  useEffect(() => {
    if (lastTierRef.current !== tier) {
      // Tier changed — a fresh seen-set so one-shots in the new tier evaluate
      // from scratch. (Carried-over one-shots from prior tiers are out of this
      // tier's scene per the registry; they don't re-mount here.)
      seenRef.current = new Set();
      lastTierRef.current = tier;
    }
    const owned = names.filter((n) => (levels[n] ?? 0) >= 1);
    const next: OneShotMount[] = owned.map((n) => {
      const fresh = !seenRef.current.has(n);
      return { name: n, freshStart: fresh };
    });
    // Mark all currently-owned as seen so subsequent renders report them as
    // non-fresh (already mounted).
    for (const n of owned) seenRef.current.add(n);
    setMounts(next);
  }, [tier, levels, names]);

  return mounts;
}
