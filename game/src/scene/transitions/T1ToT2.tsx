// scene/transitions/T1ToT2.tsx — the T1 → T2 pull-out cinematic (absorbed from
// the spike's T1ToT2Transition + transitionTimeline, scaffold §6.1 step 5).
//
// INNER Canvas content only — CosmicCanvas hosts it (the spike wrapped this in
// its own <Canvas>; here CosmicCanvas owns the renderer/camera). The cinematic
// drives the camera + per-element tweens directly in useFrame against the
// shared three Clock, and fires onComplete when progress reaches 1 (or the hard
// timeout trips outside the frame loop).
//
// The transitionRegistry maps (fromTier, toTier) → cinematic; CosmicCanvas
// mounts this when a TRANSITION event lands. Carries its own Bloom (an inner
// component) since the camera + bloom tweens are part of the choreography.
//
// Stable-reference discipline (the spike's biggest perf trap): every array /
// object literal prop below is a module-level constant so child useMemo deps
// don't invalidate every frame. Do not inline these.

import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

import { Star } from '../components/Star';
import { PlasmaArcs } from '../components/PlasmaArcs';
import { Planet } from '../components/Planet';
import { MiniPlanet } from '../components/MiniPlanet';
import { AsteroidBelt } from '../components/AsteroidBelt';
import { ZodiacalLight } from '../components/ZodiacalLight';
import { Comet } from '../components/Comet';
import { Heliopause } from '../components/Heliopause';
import { Nebula } from '../components/Nebula';
import { DustHaze } from '../components/DustHaze';
import { DeepStarfield } from '../components/DeepStarfield';
import { MidStarfield } from '../components/MidStarfield';
import { MilkyWayBand } from '../components/MilkyWayBand';
import { FieldStarSystem } from '../components/FieldStarSystem';
import { Bloom } from '../components/Bloom';
import { PLANETS } from '../tiers/T1SolarSystem';
import { PLAYER_PLANETS, FIELD_STARS } from '../tiers/T2StellarNeighborhood';

import {
  TRANSITION_DURATION,
  TRANSITION_HARD_TIMEOUT_MS,
  T1_SUN_POSITION, T1_SUN_RADIUS,
  T2_SUN_POSITION, T2_SUN_RADIUS,
  WINDOWS, MOUNT_THRESHOLDS,
  linear, easeIn, easeOut, cubicInOut,
  subWindow, lerp, lerpVec3,
} from './transitionTimeline';
// The camera path is computed against the LIVE rigs on both ends (no stale
// anchors): it captures the actual T1 drift pose on frame 1, and pans
// CONTINUOUSLY — starting at T1's drift speed and ending at T2's — while easing
// the pull (radius/height/fov). It stashes its end azimuth via setDriftHandoff
// so T2's CameraDrift picks up from exactly there (consumeHandoff), giving a
// position- AND velocity-continuous hand-off: no snap, no stop-then-pan.
import { pickDriftFraming, DRIFT_RAD_PER_SEC } from '../cameraRig';
import { sceneParamsForTier } from '../sceneParams';
import { setDriftHandoff } from './cameraHandoff';

const KUIPER_COLORS = [
  '#b8c8d8', '#c8d4e0', '#a8b4c4',
  '#9ca0b4', '#b0bcc8', '#9a9aae',
];

const FIELD_STARS_CLOSE = FIELD_STARS.slice(0, 4);
const FIELD_STARS_MID = FIELD_STARS.slice(4, 8);
const FIELD_STARS_FAR = FIELD_STARS.slice(8, 12);

const FAR_NEBULA = {
  position: [-95, 25, -120] as [number, number, number],
  scale: 24, particleCount: 4500, subBlobs: 8,
  innerColor: '#ff6890', midColor: '#a850c0', outerColor: '#5878d8',
};

const CLOSE_T1_NEBULA = {
  position: [110, -20, -80] as [number, number, number],
  scale: 14, particleCount: 2000, subBlobs: 5,
  innerColor: '#ffa860', midColor: '#c85040', outerColor: '#404088',
};

interface T1ToT2Props {
  onComplete: () => void;
}

// Public component — the inner cinematic content. CosmicCanvas mounts it inside
// its <Canvas>, so this returns scene graph + a frame-driven controller.
export function T1ToT2({ onComplete }: T1ToT2Props) {
  // Hard timeout fires even if useFrame stalls.
  const completedRef = useRef(false);
  const fireComplete = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete();
  };

  useEffect(() => {
    const tid = setTimeout(fireComplete, TRANSITION_HARD_TIMEOUT_MS);
    return () => clearTimeout(tid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <T1ToT2Content fireComplete={fireComplete} />;
}

function T1ToT2Content({ fireComplete }: { fireComplete: () => void }) {
  const { camera, clock, size } = useThree();
  const [progress, setProgress] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const completedLocalRef = useRef(false);

  // Camera path endpoints, captured/computed once on the first frame so the
  // pull-out continues from the LIVE T1 pose and lands on the LIVE T2 pose.
  // Cylindrical (azimuth/radius/height) so the camera arcs out rather than
  // dollying in a straight line, and so it can keep drifting in the orbit's
  // sense as it pulls back (no frozen-then-restart feel).
  const startPoseRef = useRef<{ az: number; r: number; y: number; fov: number; v0: number; v1: number } | null>(null);
  const endPoseRef = useRef<{ az: number; r: number; y: number; fov: number; lookAtY: number } | null>(null);

  const sunGroupRef = useRef<THREE.Group>(null);
  const innerPlanetsRef = useRef<THREE.Group>(null);
  const outerPlanetsRef = useRef<THREE.Group>(null);
  const miniPlanetsGroupRef = useRef<THREE.Group>(null);
  const closeNebulaMatRef = useRef<THREE.PointsMaterial>(null);

  const innerPlanets = useMemo(() => PLANETS.slice(0, 3), []);
  const outerPlanets = useMemo(() => PLANETS.slice(3, 6), []);

  useFrame(() => {
    const perspCam = camera as THREE.PerspectiveCamera;

    // First frame: capture the live start pose (wherever the T1 drift orbit is
    // right now) and compute the exact end pose the live T2 drift will hold on
    // its first frame — so neither hand-off snaps.
    if (startTimeRef.current === null) {
      startTimeRef.current = clock.elapsedTime;

      const x = camera.position.x, y = camera.position.y, z = camera.position.z;
      const az0 = Math.atan2(x, z);
      const r0 = Math.hypot(x, z);
      const fov0 = perspCam.isPerspectiveCamera ? perspCam.fov : 45;

      const aspect = size.width / Math.max(1, size.height);
      const framing = pickDriftFraming(aspect);

      // Angular speeds (rad/s) of the drifts on each end — the camera pans at
      // T1's speed at the start and T2's at the end so it never stops. (A drift
      // advances azimuth by radPerSec*delta*60 → steady speed radPerSec*60.)
      const t1RadPerSec = sceneParamsForTier(1).cameraDrift?.radPerSec ?? DRIFT_RAD_PER_SEC;
      const v0 = t1RadPerSec * 60;
      const v1 = DRIFT_RAD_PER_SEC * 60;
      // The pan advances continuously in the drifts' (+) sense; total sweep is
      // the integral of a smoothstep blend v0→v1 over the duration = D*(v0+v1)/2.
      // Wherever that lands is the end azimuth — the T2 drift is told to start
      // there (setDriftHandoff), so position AND velocity match at the hand-off.
      const azEnd = az0 + TRANSITION_DURATION * (v0 + v1) / 2;

      startPoseRef.current = { az: az0, r: r0, y, fov: fov0, v0, v1 };
      endPoseRef.current = {
        az: azEnd,
        r: framing.baseDistance,
        y: framing.height,
        fov: framing.fov,
        lookAtY: framing.lookAtY,
      };
      setDriftHandoff(azEnd);
    }

    const elapsed = clock.elapsedTime - startTimeRef.current;
    const p = Math.min(1, elapsed / TRANSITION_DURATION);

    const sp = startPoseRef.current!;
    const ep = endPoseRef.current!;

    // Camera: the PULL (radius/height/fov) eases in and out via cubicInOut — it
    // settles to rest, which is correct since T2 holds those constant. The PAN
    // (azimuth) is the integral of a smoothstep blend of the two drift speeds,
    // so it is moving at v0 at the start (matching the T1 orbit it continues
    // from) and v1 at the end (matching the T2 drift it hands to) — the camera
    // is always gently turning, so the pull flows into the drift with no
    // stop-then-start.
    const camT = cubicInOut(p);
    const azP = sp.az + TRANSITION_DURATION * (sp.v0 * p + (sp.v1 - sp.v0) * (p * p * p - 0.5 * p * p * p * p));
    const r = lerp(sp.r, ep.r, camT);
    const y = lerp(sp.y, ep.y, camT);
    camera.position.set(Math.sin(azP) * r, y, Math.cos(azP) * r);
    camera.lookAt(0, lerp(0, ep.lookAtY, camT), 0);

    const fov = lerp(sp.fov, ep.fov, camT);
    if (perspCam.isPerspectiveCamera && Math.abs(perspCam.fov - fov) > 0.001) {
      perspCam.fov = fov;
      perspCam.updateProjectionMatrix();
    }

    // 3. Sun group — position + scale
    const sunT = cubicInOut(subWindow(p, WINDOWS.sunMove[0], WINDOWS.sunMove[1]));
    if (sunGroupRef.current) {
      const sunPos = lerpVec3(T1_SUN_POSITION, T2_SUN_POSITION, sunT);
      sunGroupRef.current.position.set(sunPos[0], sunPos[1], sunPos[2]);
      const sunR = lerp(T1_SUN_RADIUS, T2_SUN_RADIUS, sunT);
      sunGroupRef.current.scale.setScalar(sunR);
    }

    // 4. T1 planet groups — scale-out
    if (innerPlanetsRef.current) {
      const t = easeOut(subWindow(p, WINDOWS.innerPlanetsFade[0], WINDOWS.innerPlanetsFade[1]));
      innerPlanetsRef.current.scale.setScalar(Math.max(0, 1 - t));
    }
    if (outerPlanetsRef.current) {
      const t = easeOut(subWindow(p, WINDOWS.outerPlanetsFade[0], WINDOWS.outerPlanetsFade[1]));
      outerPlanetsRef.current.scale.setScalar(Math.max(0, 1 - t));
    }

    // 5. MiniPlanets — scale-in (when mounted)
    if (miniPlanetsGroupRef.current) {
      const t = easeIn(subWindow(p, WINDOWS.miniPlanetsFade[0], WINDOWS.miniPlanetsFade[1]));
      miniPlanetsGroupRef.current.scale.setScalar(t);
    }

    // 6. FieldStarSystem batches reveal IN PLACE via per-star revealScale (a
    //    render-side prop computed from progress below) — no origin-anchored
    //    group scale, so the neighborhood resolves where it sits as the camera
    //    pulls back, instead of erupting from the central sun.

    // 7. Close T1 nebula — live material opacity
    if (closeNebulaMatRef.current) {
      const t = linear(subWindow(p, WINDOWS.closeNebulaFade[0], WINDOWS.closeNebulaFade[1]));
      closeNebulaMatRef.current.opacity = lerp(1.0, 0.0, t);
    }

    setProgress(p);

    if (p >= 1 && !completedLocalRef.current) {
      completedLocalRef.current = true;
      fireComplete();
    }
  });

  const asteroidBeltOpacity = lerp(1.0, 0.0,
    linear(subWindow(progress, WINDOWS.asteroidBeltFade[0], WINDOWS.asteroidBeltFade[1])));
  const kuiperOpacity = lerp(1.0, 0.0,
    linear(subWindow(progress, WINDOWS.kuiperBeltFade[0], WINDOWS.kuiperBeltFade[1])));
  const zodiacalOpacity = lerp(0.50, 0.0,
    linear(subWindow(progress, WINDOWS.zodiacalLightFade[0], WINDOWS.zodiacalLightFade[1])));
  const heliopauseOpacity = lerp(0.55, 0.0,
    cubicInOut(subWindow(progress, WINDOWS.heliopauseFade[0], WINDOWS.heliopauseFade[1])));
  const dustDensity = lerp(0.0, 1.0,
    cubicInOut(subWindow(progress, WINDOWS.dustHazeFade[0], WINDOWS.dustHazeFade[1])));
  const bloomTweenT = linear(subWindow(progress, WINDOWS.bloomTween[0], WINDOWS.bloomTween[1]));
  const bloomStrength = lerp(0.75, 0.55, bloomTweenT);
  const bloomThreshold = lerp(0.40, 0.42, bloomTweenT);

  const sunShrinkT = cubicInOut(subWindow(progress, WINDOWS.sunMove[0], WINDOWS.sunMove[1]));
  const largeArcSize = lerp(0.075, 0.0231, sunShrinkT);
  const tightArcSize = lerp(0.020, 0.0110, sunShrinkT);

  // Field-star reveal scalars (0→1) — each batch resolves in place over its own
  // staggered window as the camera pulls back. Passed to FieldStarSystem as
  // revealScale, which scales each system around its OWN anchor (not the origin).
  const fieldCloseReveal = cubicInOut(subWindow(progress, WINDOWS.fieldStarsClose[0], WINDOWS.fieldStarsClose[1]));
  const fieldMidReveal = cubicInOut(subWindow(progress, WINDOWS.fieldStarsMid[0], WINDOWS.fieldStarsMid[1]));
  const fieldFarReveal = cubicInOut(subWindow(progress, WINDOWS.fieldStarsFar[0], WINDOWS.fieldStarsFar[1]));

  return (
    <>
      <MilkyWayBand />
      <DeepStarfield />

      <Nebula
        position={FAR_NEBULA.position}
        scale={FAR_NEBULA.scale}
        particleCount={FAR_NEBULA.particleCount}
        subBlobs={FAR_NEBULA.subBlobs}
        innerColor={FAR_NEBULA.innerColor}
        midColor={FAR_NEBULA.midColor}
        outerColor={FAR_NEBULA.outerColor}
      />
      <Nebula
        position={CLOSE_T1_NEBULA.position}
        scale={CLOSE_T1_NEBULA.scale}
        particleCount={CLOSE_T1_NEBULA.particleCount}
        subBlobs={CLOSE_T1_NEBULA.subBlobs}
        innerColor={CLOSE_T1_NEBULA.innerColor}
        midColor={CLOSE_T1_NEBULA.midColor}
        outerColor={CLOSE_T1_NEBULA.outerColor}
        opacity={1.0}
        materialRef={closeNebulaMatRef}
      />

      {progress > WINDOWS.midStarfieldMountAt && <MidStarfield />}

      <DustHaze density={dustDensity} extent={42} thickness={9} count={2600} />

      <Heliopause radius={18.5} asymmetry={0.30} count={1800} opacity={heliopauseOpacity} />

      <group ref={sunGroupRef}>
        <Star radius={T1_SUN_RADIUS} temperature={0.42} />
        <PlasmaArcs
          starRadius={T1_SUN_RADIUS}
          arcs={6}
          particlesPerArc={1100}
          heightMin={1.60}
          heightMax={2.50}
          angularSpanMin={0.20}
          angularSpanMax={1.10}
          speedMin={0.030}
          speedMax={0.060}
          particleSize={largeArcSize}
          hotColor="#ffe060"
          coolColor="#a01806"
          perpJitter={0.032}
          wobbleAmp={0.06}
          wobbleFreq={2.5}
          widthFluxAmp={0.55}
          widthFluxFreq={2.8}
          widthFluxSpeed={0.18}
          fireSpeed={0.35}
          fireBands={2.2}
          lifetimeMin={22}
          lifetimeMax={42}
          textureKind="soft"
          opacity={0.85}
        />
        <PlasmaArcs
          starRadius={T1_SUN_RADIUS}
          arcs={18}
          particlesPerArc={280}
          heightMin={1.22}
          heightMax={1.55}
          angularSpanMin={0.10}
          angularSpanMax={0.40}
          speedMin={0.10}
          speedMax={0.18}
          particleSize={tightArcSize}
          hotColor="#fff5d6"
          coolColor="#ffb858"
          perpJitter={0.005}
          wobbleAmp={0.018}
          wobbleFreq={3.5}
          lifetimeMin={10}
          lifetimeMax={22}
          opacity={1.0}
        />
        {progress > WINDOWS.miniPlanetsMountAt && (
          <group ref={miniPlanetsGroupRef} scale={0}>
            {PLAYER_PLANETS.map((pp, i) => <MiniPlanet key={i} {...pp} />)}
          </group>
        )}
      </group>

      <group ref={innerPlanetsRef}>
        {innerPlanets.map((pl, i) => <Planet key={i} {...pl} />)}
      </group>
      <group ref={outerPlanetsRef}>
        {outerPlanets.map((pl, i) => <Planet key={i} {...pl} />)}
      </group>

      <AsteroidBelt innerRadius={8.0} outerRadius={9.1} count={1000} thickness={0.18} midOrbitPeriod={160} opacity={asteroidBeltOpacity} />
      <AsteroidBelt
        innerRadius={14.5}
        outerRadius={16.8}
        count={1500}
        thickness={0.50}
        midOrbitPeriod={680}
        particleSize={0.040}
        colors={KUIPER_COLORS}
        opacity={kuiperOpacity}
      />
      <ZodiacalLight innerRadius={1.5} outerRadius={9.5} count={1500} thickness={0.10} opacity={zodiacalOpacity} />

      {progress < WINDOWS.cometUnmountAt && (
        <Comet
          semiMajorAxis={16}
          eccentricity={0.78}
          inclination={0.42}
          argumentOfPerihelion={0.6}
          orbitPeriod={220}
          initialAnomaly={1.4}
          nucleusRadius={0.08}
          tailLength={5.0}
          tailParticles={700}
        />
      )}

      {progress > MOUNT_THRESHOLDS.fieldStarsClose &&
        FIELD_STARS_CLOSE.map((s, i) => (
          <FieldStarSystem key={`close-${i}`} position={s.position} radius={s.radius} temperature={s.temperature} seed={i + 1} planets={s.planets} revealScale={fieldCloseReveal} />
        ))}
      {progress > MOUNT_THRESHOLDS.fieldStarsMid &&
        FIELD_STARS_MID.map((s, i) => (
          <FieldStarSystem key={`mid-${i}`} position={s.position} radius={s.radius} temperature={s.temperature} seed={i + 4 + 1} planets={s.planets} revealScale={fieldMidReveal} />
        ))}
      {progress > MOUNT_THRESHOLDS.fieldStarsFar &&
        FIELD_STARS_FAR.map((s, i) => (
          <FieldStarSystem key={`far-${i}`} position={s.position} radius={s.radius} temperature={s.temperature} seed={i + 8 + 1} planets={s.planets} revealScale={fieldFarReveal} />
        ))}

      <Bloom strength={bloomStrength} radius={0.65} threshold={bloomThreshold} />
    </>
  );
}
