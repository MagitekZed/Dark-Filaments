// transitionTimeline.ts — Pure timeline data + easing helpers for the
// T1 → T2 pull-out cinematic. No JSX. Co-locates the timeline table so
// the (prop, sub-window, easing, range) mapping is one read.
//
// Total duration is TRANSITION_DURATION seconds; all sub-window bounds
// are normalized progress ∈ [0, 1].

export const TRANSITION_DURATION = 10  // seconds, wall-clock
export const TRANSITION_HARD_TIMEOUT_MS = 12_000  // safety cap if frames stall

// ─── Easing ───────────────────────────────────────────────────────────

export const linear  = (t: number) => t
export const easeIn  = (t: number) => t * t
export const easeOut = (t: number) => 1 - (1 - t) * (1 - t)
export const cubicInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

// Map global progress 0..1 into a sub-window's 0..1. Outside the window
// returns 0 (before start) or 1 (after end).
export function subWindow(progress: number, start: number, end: number): number {
  if (progress <= start) return 0
  if (progress >= end) return 1
  return (progress - start) / (end - start)
}

// ─── Lerp helpers ─────────────────────────────────────────────────────

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function lerpVec3(
  a: readonly [number, number, number],
  b: readonly [number, number, number],
  t: number,
): [number, number, number] {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ]
}

// ─── Anchors ──────────────────────────────────────────────────────────
//
// Must match T1Scene.tsx / T2Scene.tsx defaults. If those move, update here.

export const T1_CAMERA = {
  position: [0, 3.5, 22] as const,
  fov: 60,
}

export const T2_CAMERA = {
  position: [0, 8, 52] as const,
  fov: 55,
}

export const T1_SUN_POSITION = [0, 0, 0] as const
export const T1_SUN_RADIUS = 1.0

export const T2_SUN_POSITION = [-6, 1, 4] as const
export const T2_SUN_RADIUS = 0.55

// ─── Sub-windows ──────────────────────────────────────────────────────
//
// One row per animated element. Comment fields are the easing curve +
// start→end values (encoded in the consumer, not here, to keep this
// table read-only).

export const WINDOWS = {
  // Camera — full pull, FOV widens only in the back half
  cameraPosition:        [0.00, 1.00],    // cubic-in-out, T1_CAMERA.position → T2_CAMERA.position
  cameraFov:             [0.45, 1.00],    // linear, 60 → 55

  // Sun — the visual thread; rides through the move
  sunMove:               [0.20, 0.80],    // cubic-in-out, position + scale combined

  // T1 props fade out (mostly scale-to-0 for solid objects, opacity for fields)
  innerPlanetsFade:      [0.00, 0.30],    // ease-out scale, Mercury-Earth
  outerPlanetsFade:      [0.05, 0.40],    // ease-out scale, Mars-Saturn
  asteroidBeltFade:      [0.00, 0.25],    // linear opacity, 1.0 → 0.0
  kuiperBeltFade:        [0.10, 0.45],    // linear opacity, 1.0 → 0.0
  zodiacalLightFade:     [0.00, 0.30],    // linear opacity, 0.50 → 0.0
  closeNebulaFade:       [0.00, 0.30],    // linear opacity, 1.0 → 0.0 (via materialRef)
  heliopauseFade:        [0.50, 0.85],    // cubic-in-out opacity, 0.55 → 0.0 (the late-fade beat)

  // T2 props fade in
  dustHazeFade:          [0.10, 0.70],    // cubic-in-out density, 0.0 → 1.0
  miniPlanetsFade:       [0.75, 1.00],    // ease-in scale, 0 → 1

  // Mount/unmount thresholds (boolean gates on render)
  cometUnmountAt:        0.35,            // unmount Comet when progress > this
  midStarfieldMountAt:   0.15,            // mount MidStarfield when progress > this
  miniPlanetsMountAt:    0.70,            // mount MiniPlanets group when progress > this

  // Field stars — staggered batches (close/mid/far). Each batch mounts at
  // mountAt and scale-fades over its own sub-window.
  fieldStarsClose:       [0.50, 0.75],    // close batch scale 0 → 1, mount > 0.48
  fieldStarsMid:         [0.65, 0.90],    // mid batch scale 0 → 1, mount > 0.63
  fieldStarsFar:         [0.80, 0.95],    // far batch scale 0 → 1, mount > 0.78

  // Bloom tweens
  bloomTween:            [0.30, 0.95],    // linear; strength 0.75 → 0.55, threshold 0.40 → 0.42
} as const

// Mount thresholds (slightly earlier than scale-fade start so the ref
// is mounted before its scale tween kicks in)
export const MOUNT_THRESHOLDS = {
  fieldStarsClose: 0.48,
  fieldStarsMid:   0.63,
  fieldStarsFar:   0.78,
} as const
