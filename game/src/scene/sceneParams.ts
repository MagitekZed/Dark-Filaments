// scene/sceneParams.ts — per-tier "must-match-across-components" constants
// (scaffold §3 / §6.1 step 2).
//
// NOTES.md "Couplings to fix in the real scaffold" flags two magic-number
// duplications that are silent bugs waiting to happen:
//   1. The galaxy disc spin rate (delta * 0.04 rad/s) is written in both
//      Galaxy.tsx and TwinklingStars.tsx so the embedded twinkling stars stay
//      locked to the rotating disc. If one changes the other drifts.
//   2. The black-hole axis tilt tuple [Math.PI / 2.3, 0.18, 0] is repeated
//      across BlackHoleAccretionDisc / BlackHoleInfall / BlackHoleJets /
//      BlackHoleLensing — all the BH-axis-aligned features share it and would
//      drift apart if any one changed independently.
//
// This module is the single source of truth for those couplings, keyed by
// tier. Components that need a shared constant import it from here rather than
// redefine it inline. Pure data — no JSX, no Three import — so it is safe for
// any scene module to read.
//
// As tier scenes are authored (T3/T4/T6-T11), their shared constants land here
// too. For now T1/T2/T5 are populated from the spike's proven values.

export interface TierSceneParams {
  /** Initial camera position the CosmicCanvas seeds for this tier. */
  cameraPosition: [number, number, number];
  /** Initial camera field of view (degrees). */
  cameraFov: number;
  /**
   * Optional look-at point. When present, the tier uses a STATIC curated camera
   * (no drift) holding exactly cameraPosition → cameraTarget at cameraFov — the
   * "captured default view" workflow: compose a framing in dev free-look, read
   * off the position/target/fov, and paste them here. Tiers WITHOUT a
   * cameraTarget keep the slow azimuthal CameraDrift.
   */
  cameraTarget?: [number, number, number];
  /** Bloom rig parameters for this tier (the spike tuned these per scene). */
  bloom: { strength: number; radius: number; threshold: number };
}

// ─── T5 Galaxy couplings ────────────────────────────────────────────────
//
// The disc spin rate shared by Galaxy.tsx (spinRef) and TwinklingStars.tsx
// (the embedded named stars track the disc). Both import GALAXY_SPIN_RATE so
// they can never drift apart again.
export const GALAXY_SPIN_RATE = 0.04; // rad/s, applied as delta * rate

// The galaxy's overall view tilt (T5Scene wrapped the disc + BH group in this).
export const GALAXY_VIEW_TILT: [number, number, number] = [-0.45, 0, 0.18];

// The black-hole axis-aligned feature tilt, shared by every BH accessory
// (accretion disc, infall, jets, lensing). Pulled out of the per-component
// inline literals so the BH axis is defined once.
export const BLACK_HOLE_AXIS_TILT: [number, number, number] = [Math.PI / 2.3, 0.18, 0];

// ─── Per-tier camera + bloom table ──────────────────────────────────────
//
// Values lifted verbatim from the spike's per-scene <Canvas> definitions so
// the absorbed scenes frame identically to how they were authored:
//   T1 — MainScene/T1Scene title framing (camera [0, 4.5, 28], fov 38)
//   T2 — T2Scene (camera [0, 8, 52], fov 55)
//   T5 — T5Scene (camera [3.0, 2.2, 4.8], fov 55)
//
// Tiers without an authored scene yet fall back to the T1 framing (the
// registry mounts a quiet default scene for them — see tiers/registry.ts).
export const TIER_SCENE_PARAMS: Record<number, TierSceneParams> = {
  1: {
    // Captured default view (2026-05-23) — composed in dev free-look and set as
    // the T1 title/home framing. Static (cameraTarget present): holds this exact
    // composition rather than drifting.
    cameraPosition: [7.9, 2.56, -25.63],
    cameraFov: 38,
    cameraTarget: [0, 0, 0],
    bloom: { strength: 0.75, radius: 0.65, threshold: 0.4 },
  },
  2: {
    cameraPosition: [0, 8, 52],
    cameraFov: 55,
    bloom: { strength: 0.55, radius: 0.65, threshold: 0.42 },
  },
  5: {
    cameraPosition: [3.0, 2.2, 4.8],
    cameraFov: 55,
    bloom: { strength: 0.45, radius: 0.6, threshold: 0.45 },
  },
};

// Default framing for tiers whose scene is not yet authored. Standalone (NOT an
// alias of T1) and intentionally WITHOUT a cameraTarget, so unauthored tiers
// keep the slow CameraDrift rather than inheriting T1's static composition.
export const DEFAULT_SCENE_PARAMS: TierSceneParams = {
  cameraPosition: [0, 4.5, 28.0],
  cameraFov: 38,
  bloom: { strength: 0.75, radius: 0.65, threshold: 0.4 },
};

export function sceneParamsForTier(tier: number): TierSceneParams {
  return TIER_SCENE_PARAMS[tier] ?? DEFAULT_SCENE_PARAMS;
}
