// scene/tiers/registry.ts — tier number → scene component map (scaffold §3).
//
// This is the attach point for T3, T4, T6–T11: as each tier's scene is
// authored, add its component here and the CosmicCanvas mounts it automatically
// when selectTier returns that number. Tiers without an authored scene fall
// back to DefaultTierScene (a quiet deep field) so the canvas always renders
// something rather than a black void.
//
// Pure mapping — no <Canvas>, no engine import. CosmicCanvas reads selectTier
// (store) and looks the component up here.

import type { ComponentType } from 'react';
import { T1SolarSystem } from './T1SolarSystem';
import { T2StellarNeighborhood } from './T2StellarNeighborhood';
import { T5Galaxy } from './T5Galaxy';
import { DefaultTierScene } from './DefaultTierScene';

// A tier scene is a component that returns INNER Canvas content (no Canvas of
// its own). It takes no props in v0.1 — it reads engine state via the scene
// hooks (useEngineScene / useNamedOneShots / useStackableDensity).
export type TierScene = ComponentType;

export const TIER_SCENES: Record<number, TierScene> = {
  1: T1SolarSystem,
  2: T2StellarNeighborhood,
  5: T5Galaxy,
  // 3, 4, 6–11 attach here as authored.
};

export function sceneForTier(tier: number): TierScene {
  return TIER_SCENES[tier] ?? DefaultTierScene;
}
