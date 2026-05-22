// scene/tiers/T2StellarNeighborhood.tsx — the T2 Stellar Neighborhood scene
// content (absorbed from the spike's T2Scene composition, scaffold §6.1/§6.2).
//
// INNER Canvas content only — CosmicCanvas owns renderer/bloom/camera.
//
// The big change from the spike (§6.2): the conditional upgrade components no
// longer read a mock `T2Controls` object — they read the ENGINE's owned upgrade
// levels via useSceneLevels (store selector under useShallow). Buying an upgrade
// in the running game raises its level in the snapshot; the corresponding scene
// component mounts. This satisfies CD-7 (named one-shots are universe events)
// and the stackable-density seam structurally, for the upgrades the spike has
// visuals for. Click feedback pulls toward the player star.
//
// Reads the STORE only (§12.7) — no engineClient import.

import * as THREE from 'three';
import { Star } from '../components/Star';
import { DeepStarfield } from '../components/DeepStarfield';
import { MilkyWayBand } from '../components/MilkyWayBand';
import { MidStarfield } from '../components/MidStarfield';
import { DustHaze } from '../components/DustHaze';
import { Nebula } from '../components/Nebula';
import { PlasmaArcs } from '../components/PlasmaArcs';
import { MiniPlanet, type MiniPlanetProps } from '../components/MiniPlanet';
import { FieldStarSystem } from '../components/FieldStarSystem';
import { LocalBubble } from '../components/LocalBubble';
import { Microlensing, type MicrolensTarget } from '../components/Microlensing';
import { RocheLobeOverflow } from '../components/RocheLobeOverflow';
import { BrownDwarfs } from '../components/BrownDwarfs';
import { KinematicsTracer } from '../components/StellarKinematics';
import { OpenCluster } from '../components/OpenCluster';
import { MovingGroup, type MovingGroupMember } from '../components/MovingGroup';
import { PullParticles } from '../feedback/PullParticles';
import { useSceneLevels } from '../hooks/useEngineScene';
import { useNamedOneShots } from '../hooks/useNamedOneShots';

// ─── Authoring constants (lifted verbatim from the spike's T2Scene) ──────

export const PLAYER_STAR_POSITION: [number, number, number] = [-6, 1.0, 4];
export const PLAYER_STAR_RADIUS = 0.55;
export const PLAYER_STAR_TEMPERATURE = 0.42;

export const COMPANION_STAR_POSITION: [number, number, number] = [-3.0, 1.4, 3.0];
export const COMPANION_STAR_RADIUS = 0.28;
export const COMPANION_STAR_TEMP = 0.30;

export const PECULIAR_VELOCITY_DIRECTION: [number, number, number] = [0.55, 0.65, -0.30];
export const PECULIAR_VELOCITY_COLOR = new THREE.Color(0.95, 0.45, 0.92);
export const PECULIAR_VELOCITY_LENGTH = 6.0;
export const PECULIAR_VELOCITY_RADIUS = 0.055;

export interface FieldStar {
  position: [number, number, number];
  radius: number;
  temperature: number;
  planets: MiniPlanetProps[];
}

export const PLAYER_PLANETS: MiniPlanetProps[] = [
  {
    orbitRadius: 1.05, orbitPeriod: 9, radius: 0.055, initialAngle: 0.4, inclination: 0.05,
    colorA: '#3a1808', colorB: '#a85838', colorC: '#e0a060', banded: 0, noiseScale: 4.6, brightness: 1.0,
    showOrbitRing: true, ringColor: '#5a4a36', ringOpacity: 0.16,
  },
  {
    orbitRadius: 1.55, orbitPeriod: 18, radius: 0.065, initialAngle: 2.1, inclination: 0.02,
    colorA: '#0c2848', colorB: '#3878a8', colorC: '#d8e8f0', banded: 0.25, noiseScale: 3.6, brightness: 1.0,
    showOrbitRing: true, ringColor: '#3a4858', ringOpacity: 0.16,
  },
  {
    orbitRadius: 2.25, orbitPeriod: 38, radius: 0.090, initialAngle: 4.8, inclination: -0.08,
    colorA: '#5a3a20', colorB: '#c89868', colorC: '#f0d8a8', banded: 1.0, noiseScale: 3.0, brightness: 0.95,
    showOrbitRing: true, ringColor: '#4a4030', ringOpacity: 0.18,
  },
];

export const FIELD_STARS: FieldStar[] = [
  { position: [-18, 2, -8], radius: 0.18, temperature: 0.10, planets: [
    { orbitRadius: 0.40, orbitPeriod: 4, radius: 0.025, initialAngle: 1.8, colorA: '#1a0808', colorB: '#5a2818', colorC: '#a85838', banded: 0, noiseScale: 4.0, brightness: 0.9 } ] },
  { position: [12, 8, -32], radius: 0.20, temperature: 0.17, planets: [
    { orbitRadius: 0.42, orbitPeriod: 6, radius: 0.032, initialAngle: 2.0, colorA: '#180a06', colorB: '#683820', colorC: '#b86840', banded: 0, noiseScale: 4.4, brightness: 0.9 } ] },
  { position: [-28, 6, -4], radius: 0.22, temperature: 0.22, planets: [
    { orbitRadius: 0.45, orbitPeriod: 5, radius: 0.035, initialAngle: 2.7, colorA: '#2a1408', colorB: '#a05038', colorC: '#d8a878', banded: 0, noiseScale: 4.6, brightness: 0.95, inclination: 0.12 },
    { orbitRadius: 0.78, orbitPeriod: 16, radius: 0.042, initialAngle: 4.4, colorA: '#1a1414', colorB: '#605040', colorC: '#a89888', banded: 0, noiseScale: 4.2, brightness: 0.85 } ] },
  { position: [6, -8, 26], radius: 0.30, temperature: 0.35, planets: [
    { orbitRadius: 0.80, orbitPeriod: 11, radius: 0.038, initialAngle: 0.9, colorA: '#3a2010', colorB: '#b08068', colorC: '#e8c898', banded: 0, noiseScale: 4.0, brightness: 0.95, inclination: -0.05 },
    { orbitRadius: 1.30, orbitPeriod: 22, radius: 0.048, initialAngle: 2.6, colorA: '#10283c', colorB: '#5878a0', colorC: '#c8d8e8', banded: 0.4, noiseScale: 3.4, brightness: 0.95, showOrbitRing: true, ringOpacity: 0.12 },
    { orbitRadius: 1.90, orbitPeriod: 44, radius: 0.058, initialAngle: 5.3, colorA: '#102a48', colorB: '#5078b0', colorC: '#a0c0e0', banded: 0.9, noiseScale: 2.8, brightness: 0.85, inclination: 0.08 } ] },
  { position: [-4, -6, 34], radius: 0.28, temperature: 0.40, planets: [
    { orbitRadius: 0.85, orbitPeriod: 13, radius: 0.038, initialAngle: 5.4, colorA: '#2a1a10', colorB: '#a87858', colorC: '#e8b890', banded: 0, noiseScale: 4.0, brightness: 0.95 },
    { orbitRadius: 1.75, orbitPeriod: 40, radius: 0.075, initialAngle: 0.7, colorA: '#4a2808', colorB: '#c89060', colorC: '#f0d098', banded: 1.0, noiseScale: 3.0, brightness: 0.95, showOrbitRing: true, ringOpacity: 0.16, inclination: -0.04 } ] },
  { position: [36, 3, -28], radius: 0.32, temperature: 0.52, planets: [
    { orbitRadius: 0.65, orbitPeriod: 9, radius: 0.035, initialAngle: 1.7, colorA: '#28180c', colorB: '#a07858', colorC: '#d8b890', banded: 0, noiseScale: 4.2, brightness: 0.95 },
    { orbitRadius: 1.10, orbitPeriod: 24, radius: 0.045, initialAngle: 4.1, colorA: '#0c2030', colorB: '#5078a0', colorC: '#c8d8e8', banded: 0.3, noiseScale: 3.6, brightness: 0.95 } ] },
  { position: [-14, -3, -26], radius: 0.32, temperature: 0.58, planets: [
    { orbitRadius: 0.75, orbitPeriod: 14, radius: 0.038, initialAngle: 5.1, colorA: '#28140c', colorB: '#a06848', colorC: '#e8b890', banded: 0, noiseScale: 4.2, brightness: 0.95 } ] },
  { position: [-34, -4, 18], radius: 0.38, temperature: 0.68, planets: [
    { orbitRadius: 1.40, orbitPeriod: 32, radius: 0.058, initialAngle: 3.0, colorA: '#48301a', colorB: '#c89868', colorC: '#f0d8b0', banded: 0.85, noiseScale: 2.8, brightness: 0.95, showOrbitRing: true, ringOpacity: 0.15, inclination: 0.07 } ] },
  { position: [22, 4, -10], radius: 0.42, temperature: 0.74, planets: [
    { orbitRadius: 0.85, orbitPeriod: 12, radius: 0.042, initialAngle: 1.2, colorA: '#2a180c', colorB: '#a07858', colorC: '#e0b890', banded: 0, noiseScale: 4.0, brightness: 0.95 },
    { orbitRadius: 1.55, orbitPeriod: 28, radius: 0.055, initialAngle: 3.8, colorA: '#10283c', colorB: '#5078a0', colorC: '#c8d8e8', banded: 0.4, noiseScale: 3.2, brightness: 0.95, inclination: 0.1, showOrbitRing: true, ringOpacity: 0.12 } ] },
  { position: [28, 5, 32], radius: 0.48, temperature: 0.85, planets: [
    { orbitRadius: 0.95, orbitPeriod: 8, radius: 0.045, initialAngle: 3.2, colorA: '#3a1810', colorB: '#c87038', colorC: '#f0c878', banded: 0, noiseScale: 3.8, brightness: 1.0 } ] },
  { position: [30, -5, 14], radius: 0.50, temperature: 0.90, planets: [
    { orbitRadius: 1.00, orbitPeriod: 7, radius: 0.052, initialAngle: 0.6, colorA: '#481810', colorB: '#c84818', colorC: '#f0a060', banded: 0, noiseScale: 3.8, brightness: 1.0 } ] },
  { position: [38, -2, -22], radius: 0.55, temperature: 0.95, planets: [
    { orbitRadius: 1.20, orbitPeriod: 6, radius: 0.055, initialAngle: 4.0, colorA: '#481408', colorB: '#c83820', colorC: '#f08858', banded: 0, noiseScale: 3.6, brightness: 1.0 } ] },
];

export const MICROLENS_TARGETS: MicrolensTarget[] = [
  { position: PLAYER_STAR_POSITION, radius: PLAYER_STAR_RADIUS },
  ...FIELD_STARS.map((s) => ({ position: s.position, radius: s.radius })),
];

export const MOVING_GROUP_TARGETS: MovingGroupMember[] = [
  { position: [-18, 2, -8], radius: 0.18 },
  { position: [22, 4, -10], radius: 0.42 },
  { position: [6, -8, 26], radius: 0.30 },
  { position: [-14, -3, -26], radius: 0.32 },
  { position: [-28, 6, -4], radius: 0.22 },
];
export const MOVING_GROUP_DIRECTION: [number, number, number] = [0.6, 0.3, -0.5];

// Each Wolf-Rayet level promotes the next host in this order (B/O, hot A, hot A).
export const WOLF_RAYET_HOST_INDICES = [11, 10, 9];

export function T2StellarNeighborhood() {
  // Engine-driven: owned upgrade levels replace the spike's mock T2Controls.
  const levels = useSceneLevels();
  // STUB plumbing exercised (named one-shots; see useNamedOneShots).
  const oneShots = useNamedOneShots(2);
  void oneShots;

  const lvl = (name: string): number => levels[name] ?? 0;
  const owned = (name: string): boolean => lvl(name) >= 1;

  const stellarKinematics = lvl('Stellar Kinematics');
  const localBubble = lvl('Local Bubble');
  const microlensing = lvl('Microlensing');
  const rocheLobeOverflow = lvl('Roche Lobe Overflow');
  const brownDwarf = lvl('Brown Dwarf');
  const wolfRayet = lvl('Wolf-Rayet Star');
  const binaryPartner = owned('Binary Partner');
  const peculiarVelocity = owned('Peculiar Velocity');
  const openCluster = owned('Open Cluster');
  const movingGroup = owned('Moving Group');

  // Local Bubble thins the base dust haze as it stacks (engine-driven now).
  const dustDensity = 1.0 - Math.min(localBubble / 99, 1) * 0.7;

  return (
    <>
      <MilkyWayBand />
      <DeepStarfield />
      <MidStarfield />
      <Nebula
        position={[-100, 35, -125]}
        scale={20}
        particleCount={3500}
        subBlobs={6}
        innerColor="#ff7090"
        midColor="#b860c0"
        outerColor="#5878d8"
      />
      <DustHaze density={dustDensity} extent={42} thickness={9} count={2600} />

      {/* Player star — off-center, sun-like, carried from T1. */}
      <group position={PLAYER_STAR_POSITION}>
        <Star radius={PLAYER_STAR_RADIUS} temperature={PLAYER_STAR_TEMPERATURE} />
        <PlasmaArcs
          starRadius={PLAYER_STAR_RADIUS}
          arcs={6}
          particlesPerArc={600}
          heightMin={1.60}
          heightMax={2.50}
          angularSpanMin={0.20}
          angularSpanMax={1.10}
          speedMin={0.030}
          speedMax={0.060}
          particleSize={0.042 * PLAYER_STAR_RADIUS}
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
          starRadius={PLAYER_STAR_RADIUS}
          arcs={16}
          particlesPerArc={160}
          heightMin={1.22}
          heightMax={1.55}
          angularSpanMin={0.10}
          angularSpanMax={0.40}
          speedMin={0.10}
          speedMax={0.18}
          particleSize={0.020 * PLAYER_STAR_RADIUS}
          hotColor="#fff5d6"
          coolColor="#ffb858"
          perpJitter={0.005}
          wobbleAmp={0.018}
          wobbleFreq={3.5}
          lifetimeMin={10}
          lifetimeMax={22}
          opacity={1.0}
        />
        {PLAYER_PLANETS.map((p, i) => <MiniPlanet key={i} {...p} />)}
        {peculiarVelocity && (
          <KinematicsTracer
            direction={PECULIAR_VELOCITY_DIRECTION}
            length={PECULIAR_VELOCITY_LENGTH}
            radius={PECULIAR_VELOCITY_RADIUS}
            startOffset={PLAYER_STAR_RADIUS}
            color={PECULIAR_VELOCITY_COLOR}
          />
        )}
      </group>

      {/* Sparse field — Wolf-Rayet promotes the hottest hosts as it stacks. */}
      {FIELD_STARS.map((s, i) => {
        const wolfRayetActive = WOLF_RAYET_HOST_INDICES.slice(0, wolfRayet).includes(i);
        return (
          <FieldStarSystem
            key={i}
            position={s.position}
            radius={s.radius}
            temperature={s.temperature}
            seed={i + 1}
            planets={s.planets}
            kinematicsLevel={stellarKinematics}
            wolfRayetActive={wolfRayetActive}
          />
        );
      })}

      {localBubble > 0 && <LocalBubble level={localBubble} center={PLAYER_STAR_POSITION} />}
      {microlensing > 0 && <Microlensing lensStars={MICROLENS_TARGETS} level={microlensing} />}
      {binaryPartner && (
        <FieldStarSystem
          position={COMPANION_STAR_POSITION}
          radius={COMPANION_STAR_RADIUS}
          temperature={COMPANION_STAR_TEMP}
          brightness={1.4}
          seed={99}
          bobAmplitude={0}
        />
      )}
      {binaryPartner && rocheLobeOverflow > 0 && (
        <RocheLobeOverflow
          accretorPos={PLAYER_STAR_POSITION}
          accretorRadius={PLAYER_STAR_RADIUS}
          donorPos={COMPANION_STAR_POSITION}
          donorRadius={COMPANION_STAR_RADIUS}
          level={rocheLobeOverflow}
        />
      )}
      {brownDwarf > 0 && <BrownDwarfs level={brownDwarf} />}
      {openCluster && <OpenCluster />}
      {movingGroup && <MovingGroup stars={MOVING_GROUP_TARGETS} direction={MOVING_GROUP_DIRECTION} />}

      {/* Click feedback — matter pulled toward the off-center player star. */}
      <PullParticles sunPosition={PLAYER_STAR_POSITION} />
    </>
  );
}
