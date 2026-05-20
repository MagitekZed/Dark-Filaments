import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { PerspectiveCamera } from 'three'
import { Star } from './Star'
import { Planet } from './Planet'
import { AsteroidBelt } from './AsteroidBelt'
import { ZodiacalLight } from './ZodiacalLight'
import { Comet } from './Comet'
import { PlasmaArcs } from './PlasmaArcs'
import { Bloom } from './Bloom'
import { DeepStarfield } from './DeepStarfield'
import { MidStarfield } from './MidStarfield'
import { MilkyWayBand } from './MilkyWayBand'
import { Heliopause } from './Heliopause'
import { Nebula } from './Nebula'
import { PLANETS } from './T1Scene'
import { PullParticles } from './PullParticles'

// ─── MainScene — unified Canvas for the Title → T1 UI Test pathway ───
//
// One Canvas mounts for the whole Title → Begin → T1UI flow. The WebGL
// context, the planets' orbital state, and the prominence cycle are
// preserved across the transition — no remount, no clock reset, no
// fade-to-black.
//
// Title phase: a contemplative subset of T1's scene. Curated drift
// camera; no extras (no comet, no nebulae, no belts, no zodiacal light,
// no heliopause).
//
// On Begin click, App.tsx flips this component's `phase` to 't1ui' and
// supplies a `transitionStartMs` timestamp. The extras MOUNT (they
// weren't in the tree before) and an internal opacity tween brings them
// from 0 → 1 over EXTRAS_FADE_MS. CameraDrift gracefully hands off to
// OrbitControls at the same time — drift slows and stops, OrbitControls
// activates so the player can look around freely.

const STAR_RADIUS = 1.0
const EXTRAS_FADE_MS = 1600   // how long the extras take to reach full opacity
const DRIFT_DECAY_MS = 1400   // how long CameraDrift takes to slow to zero after Begin

// Slow azimuthal rotation around the system center, no translation.
const DRIFT_RAD_PER_SEC = 0.0008

export type MainScenePhase = 'title' | 't1ui'

interface MainSceneProps {
  phase: MainScenePhase
  /** Wall-clock timestamp at which the transition began. null when in
   *  steady title or steady t1ui state (no animation in flight). */
  transitionStartMs: number | null
  resetVersion?: number
}

// Viewport-aware framing for the title phase. Pulls back to show more
// deep field on desktop; pulls in and lifts the camera for vertical
// portrait framing on mobile.
function pickTitleFraming(aspect: number) {
  if (aspect >= 1.4) return { fov: 38, baseDistance: 28.0, height: 4.5, lookAtY: 0 }
  if (aspect >= 1.0) return { fov: 45, baseDistance: 24.0, height: 4.0, lookAtY: 0 }
  return { fov: 52, baseDistance: 20.0, height: 5.5, lookAtY: -0.5 }
}

// CameraDrift runs while we're in title phase. It also continues briefly
// after the transition begins (decaying to zero over DRIFT_DECAY_MS) so
// the camera doesn't jolt — OrbitControls then picks up wherever the
// camera ended up.
function CameraDrift({
  active,
  transitionStartMs,
}: {
  active: boolean
  transitionStartMs: number | null
}) {
  const { camera, size } = useThree()
  const azimuthRef = useRef(0.7)
  const startedRef = useRef(false)

  const framing = useMemo(() => {
    const aspect = size.width / Math.max(1, size.height)
    return pickTitleFraming(aspect)
  }, [size.width, size.height])

  useEffect(() => {
    // On first mount in title phase, set FOV + starting position.
    if (!startedRef.current) {
      const persp = camera as PerspectiveCamera
      if ((persp as PerspectiveCamera).isPerspectiveCamera) {
        persp.fov = framing.fov
        persp.updateProjectionMatrix()
      }
      startedRef.current = true
    }
  }, [camera, framing])

  useFrame((_state, delta) => {
    if (!active) return

    let rateScale = 1.0
    // If a transition is in flight, decay the drift rate toward zero so
    // the camera stops moving by the time OrbitControls takes over.
    if (transitionStartMs != null) {
      const elapsed = performance.now() - transitionStartMs
      rateScale = Math.max(0, 1 - elapsed / DRIFT_DECAY_MS)
    }

    if (rateScale > 0) {
      azimuthRef.current += DRIFT_RAD_PER_SEC * delta * 60 * rateScale
    }

    const a = azimuthRef.current
    const r = framing.baseDistance
    camera.position.set(Math.sin(a) * r, framing.height, Math.cos(a) * r)
    camera.lookAt(0, framing.lookAtY, 0)
  })

  return null
}

// Tween the extras' opacity prop from 0 → 1 (or hold at 1) based on the
// transition start time. Returns a stable opacity value that re-renders
// the component tree only when it crosses meaningful thresholds.
function useExtrasOpacity(phase: MainScenePhase, transitionStartMs: number | null) {
  const [opacity, setOpacity] = useState<number>(phase === 't1ui' && transitionStartMs == null ? 1 : 0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    // Steady states — no animation needed.
    if (phase === 'title') {
      setOpacity(0)
      return
    }
    if (phase === 't1ui' && transitionStartMs == null) {
      setOpacity(1)
      return
    }

    // Animating from 0 → 1.
    const tick = () => {
      const elapsed = performance.now() - (transitionStartMs ?? performance.now())
      const t = Math.min(1, Math.max(0, elapsed / EXTRAS_FADE_MS))
      // Smoothstep so it eases in.
      const eased = t * t * (3 - 2 * t)
      setOpacity(eased)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
  }, [phase, transitionStartMs])

  return opacity
}

type OrbitControlsImpl = { reset: () => void }

function CameraResetWatcher({
  version,
  controlsRef,
}: {
  version: number
  controlsRef: React.RefObject<OrbitControlsImpl | null>
}) {
  useEffect(() => {
    if (version > 0) controlsRef.current?.reset()
  }, [version, controlsRef])
  return null
}

export function MainScene({ phase, transitionStartMs, resetVersion = 0 }: MainSceneProps) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null)
  const extrasOpacity = useExtrasOpacity(phase, transitionStartMs)

  // Extras mount the moment we leave title phase. Their opacity ramps
  // from 0 → 1 over EXTRAS_FADE_MS via useExtrasOpacity above.
  const showExtras = phase === 't1ui'

  // OrbitControls activates once the camera drift has decayed —
  // otherwise we'd fight the drift each frame. Driven by a timer that
  // flips state DRIFT_DECAY_MS after transitionStartMs.
  const [driftDecayed, setDriftDecayed] = useState<boolean>(
    phase === 't1ui' && transitionStartMs == null
  )

  useEffect(() => {
    if (phase === 'title') {
      setDriftDecayed(false)
      return
    }
    // phase === 't1ui'
    if (transitionStartMs == null) {
      // Direct entry (no transition in flight); decayed immediately.
      setDriftDecayed(true)
      return
    }
    setDriftDecayed(false)
    const elapsed = performance.now() - transitionStartMs
    const remaining = Math.max(0, DRIFT_DECAY_MS - elapsed)
    const id = window.setTimeout(() => setDriftDecayed(true), remaining)
    return () => window.clearTimeout(id)
  }, [phase, transitionStartMs])

  const showOrbitControls = phase === 't1ui' && driftDecayed
  const driftActive = !showOrbitControls

  return (
    <Canvas
      camera={{ position: [0, 4.5, 28.0], fov: 38 }}
      dpr={[1, 2]}
      gl={{ antialias: true }}
    >
      <color attach="background" args={['#000']} />

      {/* Always-on background layers */}
      <MilkyWayBand />
      <DeepStarfield />
      <MidStarfield />

      {/* Nebulae — only in t1ui phase, fading in */}
      {showExtras && (
        <>
          <Nebula
            position={[-95, 25, -120]}
            scale={24}
            particleCount={4500}
            subBlobs={8}
            innerColor="#ff6890"
            midColor="#a850c0"
            outerColor="#5878d8"
            opacity={0.55 * extrasOpacity}
          />
          <Nebula
            position={[110, -20, -80]}
            scale={14}
            particleCount={2000}
            subBlobs={5}
            innerColor="#ffa860"
            midColor="#c85040"
            outerColor="#404088"
            opacity={0.55 * extrasOpacity}
          />
        </>
      )}

      {/* Heliopause — only in t1ui phase, fading in */}
      {showExtras && (
        <Heliopause
          radius={18.5}
          asymmetry={0.30}
          count={1800}
          opacity={0.55 * extrasOpacity}
        />
      )}

      {/* Sun — always */}
      <Star radius={STAR_RADIUS} temperature={0.42} />

      {/* Prominences + coronal loops — always */}
      <PlasmaArcs
        starRadius={STAR_RADIUS}
        arcs={6}
        particlesPerArc={1100}
        heightMin={1.60}
        heightMax={2.50}
        angularSpanMin={0.20}
        angularSpanMax={1.10}
        speedMin={0.030}
        speedMax={0.060}
        particleSize={0.075}
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
        starRadius={STAR_RADIUS}
        arcs={18}
        particlesPerArc={280}
        heightMin={1.22}
        heightMax={1.55}
        angularSpanMin={0.10}
        angularSpanMax={0.40}
        speedMin={0.10}
        speedMax={0.18}
        particleSize={0.020}
        hotColor="#fff5d6"
        coolColor="#ffb858"
        perpJitter={0.005}
        wobbleAmp={0.018}
        wobbleFreq={3.5}
        lifetimeMin={10}
        lifetimeMax={22}
        opacity={1.0}
      />

      {/* Planets — always */}
      {PLANETS.map((p, i) => <Planet key={i} {...p} />)}

      {/* Asteroid belts — only in t1ui phase, fading in */}
      {showExtras && (
        <>
          <AsteroidBelt
            innerRadius={8.0}
            outerRadius={9.1}
            count={1000}
            thickness={0.18}
            midOrbitPeriod={160}
            opacity={extrasOpacity}
          />
          <AsteroidBelt
            innerRadius={14.5}
            outerRadius={16.8}
            count={1500}
            thickness={0.50}
            midOrbitPeriod={680}
            particleSize={0.040}
            colors={[
              '#b8c8d8', '#c8d4e0', '#a8b4c4',
              '#9ca0b4', '#b0bcc8', '#9a9aae',
            ]}
            opacity={extrasOpacity}
          />
        </>
      )}

      {/* Zodiacal light — only in t1ui phase, fading in */}
      {showExtras && (
        <ZodiacalLight
          innerRadius={1.5}
          outerRadius={9.5}
          count={1500}
          thickness={0.10}
          opacity={0.50 * extrasOpacity}
        />
      )}

      {/* Click feedback particles — only in t1ui phase. Mount-only; the
          PullParticles system has its own per-particle alpha so no
          opacity ramp is needed (taps spawn only after t1ui phase). */}
      {showExtras && <PullParticles sunPosition={[0, 0, 0]} />}

      {/* Comet — only in t1ui phase. Comet has internal alpha logic;
          we delay-mount it via showExtras and let its tail spawn
          naturally. */}
      {showExtras && (
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

      {/* Camera control — drift during title + transition, OrbitControls
          after the drift decays. */}
      <CameraDrift active={driftActive} transitionStartMs={transitionStartMs} />
      {showOrbitControls && (
        <>
          <OrbitControls
            ref={controlsRef}
            enableDamping
            dampingFactor={0.08}
            enablePan
          />
          <CameraResetWatcher version={resetVersion} controlsRef={controlsRef} />
        </>
      )}

      <Bloom strength={0.75} radius={0.65} threshold={0.4} />
    </Canvas>
  )
}
