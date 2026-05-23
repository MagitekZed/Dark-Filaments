// scene/CosmicCanvas.tsx — the single <Canvas> for the cosmic scene
// (scaffold §6.1 step 1 + §6.2 + §12.4).
//
// Consolidates the spike's per-scene <Canvas> definitions (MainScene / T1Scene
// / T2Scene / T5Scene each redefined camera/dpr/gl) into ONE canvas that:
//   - takes the live tier (read from the store via useEngineScene) and mounts
//     the tier's scene from tiers/registry.ts,
//   - plays the transition cinematic (transitions/transitionRegistry.ts) when a
//     tier-up event lands, then mounts the destination tier scene,
//   - owns the shared rig: Bloom (per-tier params from sceneParams), the curated
//     camera (cameraRig: CameraDrift by default, dev free-orbit when toggled),
//   - hosts the tap surface: a pointer-up on the canvas wrapper fires the
//     click-feedback pull burst AND the engine CLICK.
//
// Depth buffer (revises Decision 8 / §12.4, 2026-05-23): logarithmicDepthBuffer
// is OFF. It had been enabled for forward-looking extreme-scale precision, but
// the absorbed scenes use custom ShaderMaterials (Star/Planet) that don't
// implement log-depth, while built-in materials (e.g. the prominence points) do
// — two incompatible depth encodings in one buffer, which broke depth tests
// (prominences drew over a transiting planet). The scenes are stylized and
// bounded per tier (the extreme span is handled across tiers via transitions,
// not in one frame), so standard depth is correct-by-default and needs no
// per-shader cooperation. Re-introduce log-depth scoped to a scene only if one
// ever genuinely needs single-frame extreme precision — and make its shaders
// log-depth-aware then.
//
// §12.7 — the scene reads the STORE, never the Worker. THE ONE EXCEPTION is the
// tap-handler wiring here: CosmicCanvas is the single sanctioned point that
// imports engineClient (sendClick). Tier/levels/transition all come from the
// store via useEngineScene. No other scene module imports engineClient (an
// ESLint rule enforces this).

import { useCallback, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Bloom } from './components/Bloom';
import { CameraDrift, StaticCamera, DevOrbitControls } from './cameraRig';
import { sceneForTier } from './tiers/registry';
import { cinematicForTransition } from './transitions/transitionRegistry';
import { sceneParamsForTier } from './sceneParams';
import { firePull } from './feedback/pullEvents';
import { useStore } from '../store';
import { useShallow } from 'zustand/react/shallow';
import { selectTier, selectRecentTierUp, selectForcedTier } from '../store/selectors';
// THE single sanctioned engineClient import in the scene layer (§6.2 tap wiring).
import { sendClick } from '../workers/engineClient';

interface ActiveTransition {
  fromTier: number;
  toTier: number;
}

export function CosmicCanvas() {
  const engineTier = useStore(selectTier);
  const forcedTier = useStore(selectForcedTier);
  const recentTierUp = useStore(useShallow(selectRecentTierUp));
  const freeOrbit = useStore((s) => s.freeOrbit);

  // The dev SceneSwitcher (G6) can force-mount any tier's scene for authoring,
  // independent of the live engine tier. forcedTier wins when set; otherwise the
  // engine drives the mounted tier. forcedTier is only ever set from the
  // import.meta.env.DEV-gated dev route, so shipped play always sees the engine
  // tier. A forced mount is a direct swap — no transition cinematic.
  const tier = forcedTier ?? engineTier;

  // The tier whose scene is currently mounted. While a cinematic is playing,
  // this lags behind the engine tier until onComplete swaps it.
  const [mountedTier, setMountedTier] = useState<number>(tier);
  const [activeTransition, setActiveTransition] = useState<ActiveTransition | null>(null);
  const lastHandledTierUpRef = useRef<string | null>(null);

  // When the engine reports a tier-up, kick off the cinematic. recentTierUp may
  // repeat across snapshots, so dedup by from->to key. Suppressed while a tier
  // is force-mounted (authoring view should not play game cinematics).
  useEffect(() => {
    if (forcedTier != null) return;
    if (!recentTierUp) return;
    const key = `${recentTierUp.fromTier}->${recentTierUp.toTier}`;
    if (lastHandledTierUpRef.current === key) return;
    lastHandledTierUpRef.current = key;
    setActiveTransition({ fromTier: recentTierUp.fromTier, toTier: recentTierUp.toTier });
  }, [recentTierUp, forcedTier]);

  // If the resolved tier jumps without a tier-up cinematic (e.g. a dev
  // SKIP_TO_TIER, a forced-tier authoring jump, or a save restore at a higher
  // tier), mount it directly.
  useEffect(() => {
    if (activeTransition) return;
    if (tier !== mountedTier) setMountedTier(tier);
  }, [tier, mountedTier, activeTransition]);

  const handleTransitionComplete = useCallback(() => {
    setActiveTransition((t) => {
      if (t) setMountedTier(t.toTier);
      return null;
    });
  }, []);

  // Tap surface — pointer-up on the canvas wrapper. Fires the click-feedback
  // pull burst at the tap point AND the engine CLICK (optimistic reflect +
  // worker post). The visual is independent of authoritative income so tap feel
  // is instant. The real ClickVerb tap point lands in G5; this is the G4 wiring.
  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    firePull(e.clientX, e.clientY);
    sendClick(1);
  }, []);

  // Renderer config from the destination/current tier (camera + bloom).
  const params = sceneParamsForTier(activeTransition ? activeTransition.toTier : mountedTier);

  const SceneComponent = sceneForTier(mountedTier);
  const Cinematic = activeTransition
    ? cinematicForTransition(activeTransition.fromTier, activeTransition.toTier)
    : null;

  return (
    <div
      style={{ position: 'fixed', inset: 0 }}
      onPointerUp={handlePointerUp}
    >
      <Canvas
        camera={{ position: params.cameraPosition, fov: params.cameraFov }}
        dpr={[1, 2]}
        // logarithmicDepthBuffer intentionally OFF (see header note) — standard
        // depth is consistent across built-in + custom-shader materials.
        gl={{ antialias: true }}
      >
        <color attach="background" args={['#000']} />

        {Cinematic ? (
          // Cinematic in flight — it carries its own Bloom + drives the camera.
          <Cinematic onComplete={handleTransitionComplete} />
        ) : (
          <>
            <SceneComponent />
            {/* Shared bloom rig (per-tier params). The cinematic supplies its
                own bloom while it runs, so we only mount this in steady state. */}
            <Bloom
              strength={params.bloom.strength}
              radius={params.bloom.radius}
              threshold={params.bloom.threshold}
            />
            {/* Curated camera by default; dev free-orbit when toggled (§6.4).
                Per-tier camera mode: a captured inclined orbit (cameraDrift) >
                a static hold (cameraTarget) > the generic viewport-aware drift.
                All are disabled while free-orbit is on so they don't fight for
                the camera each frame. */}
            {params.cameraDrift ? (
              <CameraDrift
                active={!freeOrbit}
                framing={params.cameraDrift}
                initialAzimuth={params.cameraDrift.initialAzimuth}
              />
            ) : params.cameraTarget ? (
              <StaticCamera
                active={!freeOrbit}
                position={params.cameraPosition}
                target={params.cameraTarget}
                fov={params.cameraFov}
              />
            ) : (
              <CameraDrift active={!freeOrbit} />
            )}
            <DevOrbitControls />
          </>
        )}
      </Canvas>
    </div>
  );
}
