// scene/transitions/transitionRegistry.ts — (fromTier, toTier) → cinematic
// (scaffold §3 / §6.1 step 5).
//
// Maps a tier transition to its authored cinematic. The only authored cinematic
// in v0.1 is T1→T2 (the spike's 10-second pull-out). Every other (from, to)
// pair falls back to a default crossfade until authored — so the engine can
// fire any tier transition and the scene reacts without a missing-cinematic
// crash.
//
// Cinematic components take an onComplete callback and return INNER Canvas
// content (CosmicCanvas hosts them). Pure mapping — no engine import.

import type { ComponentType } from 'react';
import { T1ToT2 } from './T1ToT2';
import { DefaultCrossfade } from './DefaultCrossfade';

export interface TransitionProps {
  onComplete: () => void;
}

export type TransitionCinematic = ComponentType<TransitionProps>;

// Keyed "from->to". Add authored cinematics here as they land.
const TRANSITIONS: Record<string, TransitionCinematic> = {
  '1->2': T1ToT2,
};

function key(fromTier: number, toTier: number): string {
  return `${fromTier}->${toTier}`;
}

// Returns the authored cinematic for a transition, or the default crossfade.
export function cinematicForTransition(fromTier: number, toTier: number): TransitionCinematic {
  return TRANSITIONS[key(fromTier, toTier)] ?? DefaultCrossfade;
}

export function hasAuthoredCinematic(fromTier: number, toTier: number): boolean {
  return key(fromTier, toTier) in TRANSITIONS;
}
