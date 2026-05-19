import { useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Star } from './Star'
import { Planet, type PlanetProps } from './Planet'
import { AsteroidBelt } from './AsteroidBelt'
import { ZodiacalLight } from './ZodiacalLight'
import { Comet } from './Comet'
import { PlasmaArcs } from './PlasmaArcs'
import { Bloom } from './Bloom'
import { DeepStarfield } from './DeepStarfield'
import { MilkyWayBand } from './MilkyWayBand'
import { Heliopause } from './Heliopause'
import { Nebula } from './Nebula'

// Local type alias for the OrbitControls instance (drei doesn't re-export it).
type OrbitControlsImpl = {
  reset: () => void
}

interface T1SceneProps {
  resetVersion?: number
}

// Watches the resetVersion prop and calls OrbitControls.reset() whenever
// it changes. Lives inside the Canvas so it can hold the controls ref.
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

// Six-planet stylized model of our Solar System.
//
// Real ratios compressed log-ish so the inner rockies are visibly
// distinct without the gas giants flying off screen. Orbit periods scale
// with a^1.5 (Kepler's 3rd) using Earth = 90s as the reference, so the
// relative timings remain truthful even though absolute scales are
// compressed.
export const PLANETS: PlanetProps[] = [
  // Mercury — small, gray, cratered, no atmosphere
  {
    orbitRadius: 3.4,
    orbitPeriod: 40,
    initialOrbitAngle: 0.3,
    planetRadius: 0.10,
    axialTilt: 0.034,
    rotationPeriod: 28,
    planetType: 'rocky',
    colorA: '#5a4f48',
    colorB: '#776a60',
    colorC: '#9c8d80',
    colorD: '#aea298',
    noiseScale: 3.4,
    showIce: false,
    cloudCoverage: 0,
    craters: true,
    atmosphereColor: '#a08070',
    atmosphereStrength: 0.0,
  },
  // Venus — pale yellow, total cloud cover, thick atmosphere
  {
    orbitRadius: 4.6,
    orbitPeriod: 64,
    initialOrbitAngle: 1.2,
    planetRadius: 0.22,
    axialTilt: 3.10,
    rotationPeriod: 22,
    planetType: 'rocky',
    colorA: '#a07930',
    colorB: '#cc9d50',
    colorC: '#e8c280',
    colorD: '#f5e5b5',
    noiseScale: 2.0,
    showIce: false,
    cloudCoverage: 0.92,
    craters: false,
    atmosphereColor: '#ffd690',
    atmosphereStrength: 1.0,
  },
  // Earth — the home blue marble
  {
    orbitRadius: 5.9,
    orbitPeriod: 90,
    initialOrbitAngle: 2.0,
    planetRadius: 0.24,
    axialTilt: 0.41,
    rotationPeriod: 14,
    planetType: 'rocky',
    colorA: '#0a2a55',
    colorB: '#2a6a3a',
    colorC: '#6a5230',
    colorD: '#f0f5f8',
    noiseScale: 2.6,
    showIce: true,
    cloudCoverage: 0.5,
    craters: false,
    atmosphereColor: '#6090ff',
    atmosphereStrength: 0.85,
    moons: [
      // Luna — gray cratered, tidally locked
      {
        orbitRadius: 0.55,
        orbitPeriod: 28,
        initialOrbitAngle: 1.2,
        planetRadius: 0.065,
        axialTilt: 0.027,
        rotationPeriod: 28, // tidally locked
        planetType: 'rocky',
        colorA: '#605850',
        colorB: '#857d72',
        colorC: '#a8a098',
        colorD: '#b8b0a0',
        noiseScale: 4.0,
        showIce: false,
        cloudCoverage: 0,
        craters: true,
        atmosphereStrength: 0,
      },
    ],
  },
  // Mars — dusty red, polar ice, thin atmosphere
  {
    orbitRadius: 7.1,
    orbitPeriod: 120,
    initialOrbitAngle: 3.0,
    planetRadius: 0.14,
    axialTilt: 0.44,
    rotationPeriod: 13,
    planetType: 'rocky',
    colorA: '#7a3818',
    colorB: '#9c4520',
    colorC: '#5a2810',
    colorD: '#e8dccc',
    noiseScale: 2.8,
    showIce: true,
    cloudCoverage: 0.10,
    craters: false,
    atmosphereColor: '#ff9070',
    atmosphereStrength: 0.35,
  },
  // Jupiter — banded gas giant, huge, Great Red Spot
  {
    orbitRadius: 10.0,
    orbitPeriod: 200,
    initialOrbitAngle: 4.2,
    planetRadius: 0.55,
    axialTilt: 0.055,
    rotationPeriod: 22,
    planetType: 'gas',
    // dark rust belts → beige zones → cream zones — classic Hubble palette
    colorA: '#5a3520',
    colorB: '#b88a5a',
    colorC: '#e8d0a0',
    colorD: '#3a2014',
    noiseScale: 5.0,
    showIce: false,
    cloudCoverage: 0,
    craters: false,
    hasRedSpot: true,
    atmosphereColor: '#d8a070',
    atmosphereStrength: 0.5,
    moons: [
      // Io — yellow-orange volcanic moon
      {
        orbitRadius: 0.95,
        orbitPeriod: 6,
        initialOrbitAngle: 0.5,
        planetRadius: 0.075,
        axialTilt: 0,
        rotationPeriod: 6,
        planetType: 'rocky',
        colorA: '#6a4818',
        colorB: '#c08a28',
        colorC: '#f0c648',
        colorD: '#3a2810',
        noiseScale: 5.0,
        showIce: false,
        cloudCoverage: 0,
        craters: false,
        atmosphereStrength: 0,
      },
      // Europa — icy white-cream
      {
        orbitRadius: 1.25,
        orbitPeriod: 11,
        initialOrbitAngle: 2.4,
        planetRadius: 0.060,
        axialTilt: 0,
        rotationPeriod: 11,
        planetType: 'rocky',
        colorA: '#9caebc',
        colorB: '#d4dce4',
        colorC: '#f0f4f6',
        colorD: '#a8b4bc',
        noiseScale: 4.2,
        showIce: false,
        cloudCoverage: 0,
        craters: false,
        atmosphereStrength: 0,
      },
      // Ganymede — large gray
      {
        orbitRadius: 1.65,
        orbitPeriod: 18,
        initialOrbitAngle: 4.8,
        planetRadius: 0.095,
        axialTilt: 0,
        rotationPeriod: 18,
        planetType: 'rocky',
        colorA: '#605548',
        colorB: '#857a6a',
        colorC: '#a89a88',
        colorD: '#a89a88',
        noiseScale: 4.5,
        showIce: false,
        cloudCoverage: 0,
        craters: true,
        atmosphereStrength: 0,
      },
    ],
  },
  // Saturn — banded gas giant + rings, more muted than Jupiter
  {
    orbitRadius: 13.5,
    orbitPeriod: 320,
    initialOrbitAngle: 5.2,
    planetRadius: 0.48,
    axialTilt: 0.466,
    rotationPeriod: 24,
    planetType: 'gas',
    // tan → cream-tan → pale cream — Cassini-imagery palette, lower contrast than Jupiter
    colorA: '#9c7848',
    colorB: '#d4b888',
    colorC: '#f0dcb0',
    colorD: '#5a4030',
    noiseScale: 4.4,
    bandContrast: 0.40,
    showIce: false,
    cloudCoverage: 0,
    craters: false,
    atmosphereColor: '#e8c890',
    atmosphereStrength: 0.5,
    rings: {
      innerRadius: 1.25,
      outerRadius: 2.30,
      color: '#d8c498',
      bandCount: 22,
      opacity: 0.95,
    },
    moons: [
      // Titan — orange haze, thick atmosphere
      {
        orbitRadius: 2.7,
        orbitPeriod: 32,
        initialOrbitAngle: 3.0,
        planetRadius: 0.085,
        axialTilt: 0,
        rotationPeriod: 32,
        planetType: 'rocky',
        colorA: '#7a4a14',
        colorB: '#c08838',
        colorC: '#e8b260',
        colorD: '#4a2a08',
        noiseScale: 3.0,
        showIce: false,
        cloudCoverage: 0.6,
        craters: false,
        atmosphereColor: '#e0a050',
        atmosphereStrength: 0.85,
      },
    ],
  },
]

export function T1Scene({ resetVersion = 0 }: T1SceneProps) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null)

  return (
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

      {/* Prominences — handful of slow, wobbly arcs that come and go.
          Each arc has its own lifetime; old arcs fade out and new ones
          emerge elsewhere on the surface. Wide range of foot-point
          separations so some are tight loops, others span far. Fire-
          gradient mode scrolls yellow↔deep-red bands along each arc. */}
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

      {/* Coronal loops — smaller faster cycle, denser population */}
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

      {/* Asteroid belt — between Mars (7.1) and Jupiter (10.0) */}
      <AsteroidBelt
        innerRadius={8.0}
        outerRadius={9.1}
        count={1000}
        thickness={0.18}
        midOrbitPeriod={160}
      />

      {/* Kuiper Belt — beyond Saturn (13.5), inside heliopause (18.5).
          Wider, puffier, slower than the asteroid belt; icy palette. */}
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

      {/* Zodiacal light — interplanetary dust along the ecliptic plane,
          brightest near the sun. Adds warm haze along the orbital plane. */}
      <ZodiacalLight
        innerRadius={1.5}
        outerRadius={9.5}
        count={1500}
        thickness={0.10}
      />

      {/* A passing comet on an inclined, highly elliptical orbit.
          Faster period than realistic so the player visibly sees motion;
          always-on tail with flicker so it stays cinematic at any orbit
          position. */}
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
  )
}
