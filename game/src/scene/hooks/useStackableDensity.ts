// scene/hooks/useStackableDensity.ts — STUB (scaffold §3 + §6.2).
//
// CD-7: stackables contribute to aggregate scene density (more particles, more
// glow, more medium) rather than getting individual markers. This hook reads
// owned stackable levels and returns aggregate scalars the background scene
// components consume (particle-count multiplier, glow boost, medium opacity).
//
// v0.1 wires the PLUMBING for T1/T2 (a handful of the spike's economy-driven
// density effects already do this — e.g. Local Bubble thinning the dust haze);
// the per-tier density mapping for higher tiers attaches later.
//
// Engine-import seam (§4.1): a scene-side catalog of stackable NAMES, not an
// import of UPGRADES. Reads the STORE only (§12.7).

import { useMemo } from 'react';
import { useSceneLevels } from './useEngineScene';

const EMPTY_NAMES: readonly string[] = [];

// Scene-side stackable catalog (the high-cap, repeatable upgrades that build
// aggregate density). Mirrors engine data.ts stackables by name without
// importing the engine barrel.
export const STACKABLE_NAMES: Record<number, string[]> = {
  1: ['Solar Wind', 'Asteroid Belt', 'Stellar Coupling', 'Magnetosphere'],
  2: ['Stellar Kinematics', 'Local Bubble', 'Microlensing', 'Roche Lobe Overflow', 'Brown Dwarf', 'Wolf-Rayet Star'],
  3: ['Population II', 'Subhalo', 'RR Lyrae', 'Velocity Dispersion'],
  4: ['Dust Lane Density', 'HII Region', 'Proper Motion', 'Spiral Density Wave', 'High-Velocity Cloud'],
  5: ['Galactic Rotation', 'Stellar Halo', 'Galactic Coupling', 'Galactic Fountain', 'Satellite Galaxies'],
};

export interface StackableDensity {
  /** Sum of owned stackable levels in this tier — the raw aggregate. */
  totalLevels: number;
  /** Particle-count multiplier, 1.0 at zero levels rising toward a soft cap.
   *  Background components can scale their particle budgets by this. */
  particleScale: number;
  /** Additive glow boost in [0, ~0.5] — feeds bloom-adjacent opacity bumps. */
  glowBoost: number;
  /** Per-stackable level lookup, for components that key off a specific one. */
  byName: Record<string, number>;
}

// Soft saturation: levels accumulate but density saturates so the scene never
// blows out. tanh-like via x / (x + k).
function saturate(x: number, k: number): number {
  return x / (x + k);
}

export function useStackableDensity(tier: number): StackableDensity {
  const levels = useSceneLevels();
  // Stable per-tier name list (see useNamedOneShots) so the memo deps are stable.
  const names = useMemo(() => STACKABLE_NAMES[tier] ?? EMPTY_NAMES, [tier]);

  return useMemo(() => {
    const byName: Record<string, number> = {};
    let total = 0;
    for (const n of names) {
      const lv = levels[n] ?? 0;
      byName[n] = lv;
      total += lv;
    }
    // particleScale: 1.0 + up to ~+1.0 as levels climb (saturating at k=80,
    // roughly the high-cap stackable ceiling that matters visually).
    const particleScale = 1.0 + saturate(total, 80);
    const glowBoost = 0.5 * saturate(total, 120);
    return { totalLevels: total, particleScale, glowBoost, byName };
  }, [levels, names]);
}
