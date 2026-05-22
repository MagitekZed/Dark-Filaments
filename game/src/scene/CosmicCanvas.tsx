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
// Decision 8 / §12.4: gl={{ logarithmicDepthBuffer: true }} for extreme-scale
// depth precision. The spike did NOT set this; enabling it can interact with
// the hand-rolled UnrealBloomPass composer — bloom is re-verified after.
//
// §12.7 — the scene reads the STORE, never the Worker. THE ONE EXCEPTION is the
// tap-handler wiring here: CosmicCanvas is the single sanctioned point that
// imports engineClient (sendClick). Tier/levels/transition all come from the
// store via useEngineScene. No other scene module imports engineClient (an
// ESLint rule enforces this).

import { useCallback, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Bloom } from './components/Bloom';
import { CameraDrift, DevOrbitControls } from './cameraRig';
import { sceneForTier } from './tiers/registry';
import { cinematicForTransition } from './transitions/transitionRegistry';
import { sceneParamsForTier } from './sceneParams';
import { firePull } from './feedback/pullEvents';
import { useStore } from '../store';
import { useShallow } from 'zustand/react/shallow';
import { selectTier, selectRecentTierUp } from '../store/selectors';
// THE single sanctioned engineClient import in the scene layer (§6.2 tap wiring).
import { sendClick } from '../workers/engineClient';

interface ActiveTransition {
  fromTier: number;
  toTier: number;
}

export function CosmicCanvas() {
  const tier = useStore(selectTier);
  const recentTierUp = useStore(useShallow(selectRecentTierUp));
  const freeOrbit = useStore((s) => s.freeOrbit);

  // The tier whose scene is currently mounted. While a cinematic is playing,
  // this lags behind the engine tier until onComplete swaps it.
  const [mountedTier, setMountedTier] = useState<number>(tier);
  const [activeTransition, setActiveTransition] = useState<ActiveTransition | null>(null);
  const lastHandledTierUpRef = useRef<string | null>(null);

  // When the engine reports a tier-up, kick off the cinematic. recentTierUp may
  // repeat across snapshots, so dedup by from->to key.
  useEffect(() => {
    if (!recentTierUp) return;
    const key = `${recentTierUp.fromTier}->${recentTierUp.toTier}`;
    if (lastHandledTierUpRef.current === key) return;
    lastHandledTierUpRef.current = key;
    setActiveTransition({ fromTier: recentTierUp.fromTier, toTier: recentTierUp.toTier });
  }, [recentTierUp]);

  // If the engine tier jumps without a tier-up cinematic (e.g. a dev SKIP_TO_TIER
  // or a save restore at a higher tier), mount it directly.
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
        // §12.4: log-depth buffer for extreme-scale depth precision (Decision 8).
        gl={{ antialias: true, logarithmicDepthBuffer: true }}
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
                CameraDrift is disabled while free-orbit is on so they don't
                fight for the camera each frame. */}
            <CameraDrift active={!freeOrbit} />
            <DevOrbitControls />
          </>
        )}
      </Canvas>
    </div>
  );
}
