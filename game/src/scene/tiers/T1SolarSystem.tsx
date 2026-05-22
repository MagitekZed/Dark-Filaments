// scene/tiers/T1SolarSystem.tsx — the T1 Solar System scene content
// (absorbed from the spike's T1Scene / MainScene composition, scaffold §6.1).
//
// This is INNER Canvas content only — no <Canvas>, no Bloom, no OrbitControls.
// CosmicCanvas owns the renderer config, the bloom rig, and the camera (curated
// drift + dev free-orbit). The tier scene returns just the scene graph.
//
// Engine wiring (§6.2): the named-one-shot mount mechanism (useNamedOneShots)
// and the stackable-density plumbing (useStackableDensity) are wired as STUBS.
// Click feedback is PullParticles, mounted toward the Sun at the origin; the
// tap surface lives in CosmicCanvas (it fires the pull event + the engine
// CLICK). The scene reads the STORE via the hooks, never the Worker.

import { Star } from '../components/Star';
import { Planet, type PlanetProps } from '../components/Planet';
import { AsteroidBelt } from '../components/AsteroidBelt';
import { ZodiacalLight } from '../components/ZodiacalLight';
import { Comet } from '../components/Comet';
import { PlasmaArcs } from '../components/PlasmaArcs';
import { DeepStarfield } from '../components/DeepStarfield';
import { MilkyWayBand } from '../components/MilkyWayBand';
import { Heliopause } from '../components/Heliopause';
import { Nebula } from '../components/Nebula';
import { PullParticles } from '../feedback/PullParticles';
import { useNamedOneShots } from '../hooks/useNamedOneShots';
import { useStackableDensity } from '../hooks/useStackableDensity';

const STAR_RADIUS = 1.0;

// Six-planet stylized Solar System. Lifted verbatim from the spike's T1Scene
// PLANETS export (the authoring data co-locates with the scene that uses it).
export const PLANETS: PlanetProps[] = [
  // Mercury
  {
    orbitRadius: 3.4, orbitPeriod: 40, initialOrbitAngle: 0.3, planetRadius: 0.10,
    axialTilt: 0.034, rotationPeriod: 28, planetType: 'rocky',
    colorA: '#5a4f48', colorB: '#776a60', colorC: '#9c8d80', colorD: '#aea298',
    noiseScale: 3.4, showIce: false, cloudCoverage: 0, craters: true,
    atmosphereColor: '#a08070', atmosphereStrength: 0.0,
  },
  // Venus
  {
    orbitRadius: 4.6, orbitPeriod: 64, initialOrbitAngle: 1.2, planetRadius: 0.22,
    axialTilt: 3.10, rotationPeriod: 22, planetType: 'rocky',
    colorA: '#a07930', colorB: '#cc9d50', colorC: '#e8c280', colorD: '#f5e5b5',
    noiseScale: 2.0, showIce: false, cloudCoverage: 0.92, craters: false,
    atmosphereColor: '#ffd690', atmosphereStrength: 1.0,
  },
  // Earth + Luna
  {
    orbitRadius: 5.9, orbitPeriod: 90, initialOrbitAngle: 2.0, planetRadius: 0.24,
    axialTilt: 0.41, rotationPeriod: 14, planetType: 'rocky',
    colorA: '#0a2a55', colorB: '#2a6a3a', colorC: '#6a5230', colorD: '#f0f5f8',
    noiseScale: 2.6, showIce: true, cloudCoverage: 0.5, craters: false,
    atmosphereColor: '#6090ff', atmosphereStrength: 0.85,
    moons: [
      {
        orbitRadius: 0.55, orbitPeriod: 28, initialOrbitAngle: 1.2, planetRadius: 0.065,
        axialTilt: 0.027, rotationPeriod: 28, planetType: 'rocky',
        colorA: '#605850', colorB: '#857d72', colorC: '#a8a098', colorD: '#b8b0a0',
        noiseScale: 4.0, showIce: false, cloudCoverage: 0, craters: true, atmosphereStrength: 0,
      },
    ],
  },
  // Mars
  {
    orbitRadius: 7.1, orbitPeriod: 120, initialOrbitAngle: 3.0, planetRadius: 0.14,
    axialTilt: 0.44, rotationPeriod: 13, planetType: 'rocky',
    colorA: '#7a3818', colorB: '#9c4520', colorC: '#5a2810', colorD: '#e8dccc',
    noiseScale: 2.8, showIce: true, cloudCoverage: 0.10, craters: false,
    atmosphereColor: '#ff9070', atmosphereStrength: 0.35,
  },
  // Jupiter + Io/Europa/Ganymede
  {
    orbitRadius: 10.0, orbitPeriod: 200, initialOrbitAngle: 4.2, planetRadius: 0.55,
    axialTilt: 0.055, rotationPeriod: 22, planetType: 'gas',
    colorA: '#5a3520', colorB: '#b88a5a', colorC: '#e8d0a0', colorD: '#3a2014',
    noiseScale: 5.0, showIce: false, cloudCoverage: 0, craters: false, hasRedSpot: true,
    atmosphereColor: '#d8a070', atmosphereStrength: 0.5,
    moons: [
      {
        orbitRadius: 0.95, orbitPeriod: 6, initialOrbitAngle: 0.5, planetRadius: 0.075,
        axialTilt: 0, rotationPeriod: 6, planetType: 'rocky',
        colorA: '#6a4818', colorB: '#c08a28', colorC: '#f0c648', colorD: '#3a2810',
        noiseScale: 5.0, showIce: false, cloudCoverage: 0, craters: false, atmosphereStrength: 0,
      },
      {
        orbitRadius: 1.25, orbitPeriod: 11, initialOrbitAngle: 2.4, planetRadius: 0.060,
        axialTilt: 0, rotationPeriod: 11, planetType: 'rocky',
        colorA: '#9caebc', colorB: '#d4dce4', colorC: '#f0f4f6', colorD: '#a8b4bc',
        noiseScale: 4.2, showIce: false, cloudCoverage: 0, craters: false, atmosphereStrength: 0,
      },
      {
        orbitRadius: 1.65, orbitPeriod: 18, initialOrbitAngle: 4.8, planetRadius: 0.095,
        axialTilt: 0, rotationPeriod: 18, planetType: 'rocky',
        colorA: '#605548', colorB: '#857a6a', colorC: '#a89a88', colorD: '#a89a88',
        noiseScale: 4.5, showIce: false, cloudCoverage: 0, craters: true, atmosphereStrength: 0,
      },
    ],
  },
  // Saturn + rings + Titan
  {
    orbitRadius: 13.5, orbitPeriod: 320, initialOrbitAngle: 5.2, planetRadius: 0.48,
    axialTilt: 0.466, rotationPeriod: 24, planetType: 'gas',
    colorA: '#9c7848', colorB: '#d4b888', colorC: '#f0dcb0', colorD: '#5a4030',
    noiseScale: 4.4, bandContrast: 0.40, showIce: false, cloudCoverage: 0, craters: false,
    atmosphereColor: '#e8c890', atmosphereStrength: 0.5,
    rings: { innerRadius: 1.25, outerRadius: 2.30, color: '#d8c498', bandCount: 22, opacity: 0.95 },
    moons: [
      {
        orbitRadius: 2.7, orbitPeriod: 32, initialOrbitAngle: 3.0, planetRadius: 0.085,
        axialTilt: 0, rotationPeriod: 32, planetType: 'rocky',
        colorA: '#7a4a14', colorB: '#c08838', colorC: '#e8b260', colorD: '#4a2a08',
        noiseScale: 3.0, showIce: false, cloudCoverage: 0.6, craters: false,
        atmosphereColor: '#e0a050', atmosphereStrength: 0.85,
      },
    ],
  },
];

export function T1SolarSystem() {
  // STUB plumbing — wired live so the seam is real, even though T1's content
  // doesn't yet branch on them. Read here so the hooks run and the mechanism is
  // exercised (named-one-shot mount list + aggregate stackable density).
  const oneShots = useNamedOneShots(1);
  const density = useStackableDensity(1);
  void oneShots;
  void density;

  return (
    <>
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

      {/* Prominences */}
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
      {/* Coronal loops */}
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

      {/* Asteroid belt (Mars–Jupiter gap) */}
      <AsteroidBelt innerRadius={8.0} outerRadius={9.1} count={1000} thickness={0.18} midOrbitPeriod={160} />

      {/* Kuiper belt — icy palette */}
      <AsteroidBelt
        innerRadius={14.5}
        outerRadius={16.8}
        count={1500}
        thickness={0.50}
        midOrbitPeriod={680}
        particleSize={0.040}
        colors={['#b8c8d8', '#c8d4e0', '#a8b4c4', '#9ca0b4', '#b0bcc8', '#9a9aae']}
      />

      <ZodiacalLight innerRadius={1.5} outerRadius={9.5} count={1500} thickness={0.10} />

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

      {/* Click feedback — matter pulled toward the Sun at the origin. The tap
          surface (CosmicCanvas) fires pullEvents + the engine CLICK. */}
      <PullParticles sunPosition={[0, 0, 0]} />
    </>
  );
}
