import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import type { PerspectiveCamera } from 'three'
import { Star } from './Star'
import { Planet } from './Planet'
import { PlasmaArcs } from './PlasmaArcs'
import { Bloom } from './Bloom'
import { DeepStarfield } from './DeepStarfield'
import { MidStarfield } from './MidStarfield'
import { MilkyWayBand } from './MilkyWayBand'
import { PLANETS } from './T1Scene'

const STAR_RADIUS = 1.0

// Curated drift — slow rotation around the system center, no translation.
// Per the plan: ~0.0008 rad/sec orbital azimuth so the parallax across the
// planets and starfields registers without feeling like movement.
const DRIFT_RAD_PER_SEC = 0.0008

// Viewport-aware camera reframe. Aspect drives FOV and pull-back distance.
// The desktop framing pulls back further so more deep field is visible;
// portrait framing pulls in and lifts the camera slightly so the system
// composes against the upper-third of the frame.
function pickCameraFraming(aspect: number) {
  if (aspect >= 1.4) {
    // Desktop: wide cinematic
    return { fov: 38, baseDistance: 28.0, height: 4.5, lookAtY: 0 }
  }
  if (aspect >= 1.0) {
    // Tablet
    return { fov: 45, baseDistance: 24.0, height: 4.0, lookAtY: 0 }
  }
  // Mobile portrait — closer in, higher framing, look slightly down
  return { fov: 52, baseDistance: 20.0, height: 5.5, lookAtY: -0.5 }
}

function CameraDrift() {
  const { camera, size } = useThree()
  const azimuthRef = useRef(0)

  const framing = useMemo(() => {
    const aspect = size.width / Math.max(1, size.height)
    return pickCameraFraming(aspect)
  }, [size.width, size.height])

  // Apply framing on mount + on viewport change. Camera position and FOV
  // both update; perspective camera needs updateProjectionMatrix() after
  // FOV changes.
  useEffect(() => {
    // Reset azimuth to a tasteful starting angle so the planets land in
    // a pleasing parallax rather than all behind the sun.
    azimuthRef.current = 0.7
    const persp = camera as PerspectiveCamera
    if ((persp as PerspectiveCamera).isPerspectiveCamera) {
      persp.fov = framing.fov
      persp.updateProjectionMatrix()
    }
  }, [camera, framing])

  useFrame((_state, delta) => {
    azimuthRef.current += DRIFT_RAD_PER_SEC * delta * 60 // delta is sec; *60 brings the rad/sec rate to per-frame at 60fps
    const a = azimuthRef.current
    const r = framing.baseDistance
    camera.position.set(Math.sin(a) * r, framing.height, Math.cos(a) * r)
    camera.lookAt(0, framing.lookAtY, 0)
  })

  return null
}

export function TitleScene() {
  return (
    <Canvas
      camera={{ position: [0, 4.5, 28.0], fov: 38 }}
      dpr={[1, 2]}
      gl={{ antialias: true }}
    >
      <color attach="background" args={['#000']} />
      <MilkyWayBand />
      <DeepStarfield />
      <MidStarfield />
      <Star radius={STAR_RADIUS} temperature={0.42} />

      {/* Large prominences — the wobbly, slow, fire-gradient arcs that
          arch off the sun's limb. Same shape as T1Scene's primary
          PlasmaArcs layer; restored on the title for the visual drama. */}
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

      {/* Coronal loops — smaller, denser, faster cycle layered over the
          prominences. Same shape as T1Scene's secondary PlasmaArcs. */}
      <PlasmaArcs
        starRadius={STAR_RADIUS}
        arcs={14}
        particlesPerArc={260}
        heightMin={1.22}
        heightMax={1.50}
        angularSpanMin={0.10}
        angularSpanMax={0.40}
        speedMin={0.08}
        speedMax={0.14}
        particleSize={0.020}
        hotColor="#fff5d6"
        coolColor="#ffb858"
        perpJitter={0.005}
        wobbleAmp={0.018}
        wobbleFreq={3.5}
        lifetimeMin={14}
        lifetimeMax={28}
        opacity={0.95}
      />

      {PLANETS.map((p, i) => <Planet key={i} {...p} />)}

      <CameraDrift />
      <Bloom strength={0.75} radius={0.65} threshold={0.4} />
    </Canvas>
  )
}
