import { useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Star } from './Star'
import { Planet } from './Planet'
import { AsteroidBelt } from './AsteroidBelt'
import { ZodiacalLight } from './ZodiacalLight'
import { Comet } from './Comet'
import { PlasmaArcs } from './PlasmaArcs'
import { Bloom } from './Bloom'
import { DeepStarfield } from './DeepStarfield'
import { MilkyWayBand } from './MilkyWayBand'
import { Heliopause } from './Heliopause'
import { Nebula } from './Nebula'
import { PLANETS } from './T1Scene'
import { T1UIChrome } from './T1UIChrome'
import { PullParticles } from './PullParticles'

type OrbitControlsImpl = { reset: () => void }

interface T1UITestSceneProps {
  resetVersion?: number
}

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

const STAR_RADIUS = 1.0

// T1 — UI Test
//
// Same 3D scene as T1Scene with the Edge Vignette chrome layered over
// it AND a click-driven particle pull. Each tap on the cosmos spawns a
// small burst of warm-gold particles at the tap point; each particle
// drifts in its own random direction while gravity from the Sun curves
// it inward until it's absorbed. PullParticles consumes click events
// from pullEvents.ts.
//
// The scene composition mirrors T1Scene.tsx; if that file's planet
// data, belt parameters, or background composition change, this file
// needs a matching update.
export function T1UITestScene({ resetVersion = 0 }: T1UITestSceneProps) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null)

  return (
    <>
      <Canvas
        camera={{ position: [0, 3.5, 22.0], fov: 60 }}
        dpr={[1, 2]}
        gl={{ antialias: true }}
      >
        <color attach="background" args={['#000']} />
        <MilkyWayBand />
        <Nebula
          position={[-95, 25, -120]}
          scale={24}
          particleCount={4500}
          subBlobs={8}
          innerColor="#ff6890"
          midColor="#a850c0"
          outerColor="#5878d8"
        />
        <Nebula
          position={[110, -20, -80]}
          scale={14}
          particleCount={2000}
          subBlobs={5}
          innerColor="#ffa860"
          midColor="#c85040"
          outerColor="#404088"
        />
        <DeepStarfield />
        <Heliopause radius={18.5} asymmetry={0.30} count={1800} />
        <Star radius={STAR_RADIUS} temperature={0.42} />

        {/* Prominences + coronal loops — unchanged from T1Scene */}
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

        {PLANETS.map((p, i) => <Planet key={i} {...p} />)}

        <AsteroidBelt
          innerRadius={8.0}
          outerRadius={9.1}
          count={1000}
          thickness={0.18}
          midOrbitPeriod={160}
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
        />
        <ZodiacalLight
          innerRadius={1.5}
          outerRadius={9.5}
          count={1500}
          thickness={0.10}
        />

        {/* Click feedback: each tap spawns a burst of warm-gold particles
            that drift outward with their own random initial vectors,
            then curve back toward the Sun under gravity. */}
        <PullParticles sunPosition={[0, 0, 0]} />
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

        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.08}
          enablePan
        />
        <CameraResetWatcher version={resetVersion} controlsRef={controlsRef} />
        <Bloom strength={0.75} radius={0.65} threshold={0.4} />
      </Canvas>
      <T1UIChrome />
    </>
  )
}
