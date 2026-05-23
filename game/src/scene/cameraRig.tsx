// scene/cameraRig.tsx — curated camera + the single OrbitControls ref-type fix
// (scaffold §6.3 #2 + §6.4).
//
// Camera philosophy (NOTES.md "Camera/interaction philosophy decision"):
// curated camera by default; free orbit reserved for dev/authoring and the
// future Inventory artifact. This module owns:
//   - CameraDrift: slow curated azimuthal drift around the system center
//     (folded from the spike's MainScene CameraDrift), with a graceful decay
//     so a transition into free-orbit doesn't jolt.
//   - DevOrbitControls: drei <OrbitControls> mounted ONLY when devSlice.freeOrbit
//     is true. This is the single place OrbitControls is mounted in the shipped
//     tree, so the drei ref-type mismatch is solved exactly once here.
//   - useOrbitControlsRef(): the typed ref hook, against three-stdlib's actual
//     OrbitControlsImpl element type (the type drei forwards its ref to). This
//     replaces the per-file hand-rolled `type OrbitControlsImpl = { reset(): void }`
//     workaround that the spike repeated across ~6 scene files.
//
// Engine purity / §12.7: this module reads the STORE (useStore selector for
// freeOrbit), never the Worker. No engineClient import.

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { PerspectiveCamera } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useStore } from '../store';

// The one true OrbitControls ref type. drei's <OrbitControls> forwards its ref
// to three-stdlib's OrbitControlsImpl (see drei core/OrbitControls.d.ts), so a
// ref typed against it carries the real .reset() / .target / .update() surface
// — no hand-rolled stub, no `as unknown as` cast.
export type { OrbitControlsImpl };

export function useOrbitControlsRef() {
  return useRef<OrbitControlsImpl | null>(null);
}

// ─── Curated drift ──────────────────────────────────────────────────────
//
// Slow azimuthal rotation around the system center, no translation. Folded
// from MainScene's CameraDrift. `decayStartMs` (wall-clock) optionally decays
// the drift rate to zero over DRIFT_DECAY_MS so a hand-off into OrbitControls
// (free-orbit) or a transition tween doesn't jolt the camera.

const DRIFT_RAD_PER_SEC = 0.0008;
const DRIFT_DECAY_MS = 1400;

export interface DriftFraming {
  fov: number;
  baseDistance: number;
  height: number;
  lookAtY: number;
}

// Viewport-aware framing (lifted from MainScene.pickTitleFraming): pull back to
// show more deep field on desktop; pull in and lift for portrait framing on
// mobile. Used for the title/T1 contemplative drift.
export function pickDriftFraming(aspect: number): DriftFraming {
  if (aspect >= 1.4) return { fov: 38, baseDistance: 28.0, height: 4.5, lookAtY: 0 };
  if (aspect >= 1.0) return { fov: 45, baseDistance: 24.0, height: 4.0, lookAtY: 0 };
  return { fov: 52, baseDistance: 20.0, height: 5.5, lookAtY: -0.5 };
}

interface CameraDriftProps {
  active: boolean;
  /** Wall-clock ms at which to begin decaying the drift to zero. null = no decay. */
  decayStartMs?: number | null;
  /** Override framing; defaults to viewport-aware pickDriftFraming. */
  framing?: DriftFraming;
  /** Initial azimuth (radians). */
  initialAzimuth?: number;
}

export function CameraDrift({
  active,
  decayStartMs = null,
  framing: framingOverride,
  initialAzimuth = 0.7,
}: CameraDriftProps) {
  const { camera, size } = useThree();
  const azimuthRef = useRef(initialAzimuth);
  const startedRef = useRef(false);

  const framing = useMemo(() => {
    if (framingOverride) return framingOverride;
    const aspect = size.width / Math.max(1, size.height);
    return pickDriftFraming(aspect);
  }, [framingOverride, size.width, size.height]);

  useEffect(() => {
    if (!startedRef.current) {
      const persp = camera as PerspectiveCamera;
      if (persp.isPerspectiveCamera) {
        persp.fov = framing.fov;
        persp.updateProjectionMatrix();
      }
      startedRef.current = true;
    }
  }, [camera, framing]);

  useFrame((_state, delta) => {
    if (!active) return;
    let rateScale = 1.0;
    if (decayStartMs != null) {
      const elapsed = performance.now() - decayStartMs;
      rateScale = Math.max(0, 1 - elapsed / DRIFT_DECAY_MS);
    }
    if (rateScale > 0) {
      azimuthRef.current += DRIFT_RAD_PER_SEC * delta * 60 * rateScale;
    }
    const a = azimuthRef.current;
    const r = framing.baseDistance;
    camera.position.set(Math.sin(a) * r, framing.height, Math.cos(a) * r);
    camera.lookAt(0, framing.lookAtY, 0);
  });

  return null;
}

// ─── Static curated camera ───────────────────────────────────────────────
//
// A fixed curated camera that HOLDS an exact composed framing (no drift), for
// tiers whose sceneParams define a cameraTarget — the "captured default view"
// workflow (compose in dev free-look, paste position/target/fov into
// sceneParams). Snaps the camera to the framing on mount and whenever it
// re-activates (e.g. after dev free-orbit is turned off, which leaves the camera
// wherever the orbit ended). Disabled while free-orbit is on so they don't
// fight for the camera. Nothing else moves the camera on a static tier, so a
// one-shot set holds in steady state.
interface StaticCameraProps {
  active: boolean;
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
}

export function StaticCamera({ active, position, target, fov }: StaticCameraProps) {
  const { camera } = useThree();
  const [px, py, pz] = position;
  const [tx, ty, tz] = target;
  useEffect(() => {
    if (!active) return;
    const persp = camera as PerspectiveCamera;
    camera.position.set(px, py, pz);
    if (persp.isPerspectiveCamera && persp.fov !== fov) {
      persp.fov = fov;
      persp.updateProjectionMatrix();
    }
    camera.lookAt(tx, ty, tz);
  }, [active, camera, px, py, pz, tx, ty, tz, fov]);
  return null;
}

// ─── Camera reset watcher ───────────────────────────────────────────────
//
// Calls OrbitControls.reset() when `version` changes (the spike's cross-Canvas
// reset mechanism). Lives inside the Canvas so it can hold the controls ref.
export function CameraResetWatcher({
  version,
  controlsRef,
}: {
  version: number;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
}) {
  useEffect(() => {
    if (version > 0) controlsRef.current?.reset();
  }, [version, controlsRef]);
  return null;
}

// ─── Free-look camera reporter (dev capture) ──────────────────────────────
//
// While free-look is active, sample the live camera (position, the OrbitControls
// orbit target, fov, distance) ~5 Hz and write it to devSlice.cameraReadout so
// the dev panel can show — and copy — the exact framing. This is how the dev
// finds the best static view for a tier and hands back the numbers to set as the
// default. Cleared to null on unmount (free-look turned off). Dev-only: only ever
// mounted under DevOrbitControls, which is gated on freeOrbit (dev flips it).
function CameraReporter({
  controlsRef,
}: {
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
}) {
  const { camera } = useThree();
  const setCameraReadout = useStore((s) => s.setCameraReadout);
  const accRef = useRef(0);

  useFrame((_state, delta) => {
    accRef.current += delta;
    if (accRef.current < 0.2) return;
    accRef.current = 0;
    const persp = camera as PerspectiveCamera;
    const t = controlsRef.current?.target;
    const tx = t ? t.x : 0, ty = t ? t.y : 0, tz = t ? t.z : 0;
    const px = camera.position.x, py = camera.position.y, pz = camera.position.z;
    const dist = Math.hypot(px - tx, py - ty, pz - tz);
    const r = (n: number) => Math.round(n * 100) / 100;
    setCameraReadout({
      position: [r(px), r(py), r(pz)],
      target: [r(tx), r(ty), r(tz)],
      fov: persp.isPerspectiveCamera ? r(persp.fov) : 0,
      distance: r(dist),
    });
  });

  useEffect(() => () => setCameraReadout(null), [setCameraReadout]);
  return null;
}

// ─── Dev free-orbit controls ────────────────────────────────────────────
//
// drei <OrbitControls> mounted ONLY when devSlice.freeOrbit is true (§6.4).
// Shipped gameplay never mounts this — the curated camera is the experience.
// The dev camera tools (G6) and the future Inventory artifact flip freeOrbit.
//
// resetVersion drives the reset watcher (snap camera back to default view).
export function DevOrbitControls({ resetVersion = 0 }: { resetVersion?: number }) {
  const freeOrbit = useStore((s) => s.freeOrbit);
  const controlsRef = useOrbitControlsRef();
  if (!freeOrbit) return null;
  return (
    <>
      <OrbitControls ref={controlsRef} enableDamping dampingFactor={0.08} enablePan />
      <CameraResetWatcher version={resetVersion} controlsRef={controlsRef} />
      <CameraReporter controlsRef={controlsRef} />
    </>
  );
}
