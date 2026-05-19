import { useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Star } from './Star'
import { DeepStarfield } from './DeepStarfield'
import { MilkyWayBand } from './MilkyWayBand'
import { MidStarfield } from './MidStarfield'
import { DustHaze } from './DustHaze'
import { Bloom } from './Bloom'
import { Nebula } from './Nebula'
import { PlasmaArcs } from './PlasmaArcs'
import * as THREE from 'three'
import { MiniPlanet, type MiniPlanetProps } from './MiniPlanet'
import { FieldStarSystem } from './FieldStarSystem'
import { LocalBubble } from './LocalBubble'
import { Microlensing, type MicrolensTarget } from './Microlensing'
import { RocheLobeOverflow } from './RocheLobeOverflow'
import { BrownDwarfs } from './BrownDwarfs'
import { KinematicsTracer } from './StellarKinematics'
import { OpenCluster } from './OpenCluster'
import { MovingGroup, type MovingGroupMember } from './MovingGroup'

type OrbitControlsImpl = { reset: () => void }

interface T2SceneProps {
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

// ─── Base-scene authoring constants ────────────────────────────────────
//
// T2 = Stellar Neighborhood. Player's star sits off-center; a sparse
// scatter of other stars fills tens-of-parsecs around it. The base scene
// is intentionally quiet — no cavity, no cluster, no binary. Upgrade
// components mount on top to populate the field as the player buys in.

export const PLAYER_STAR_POSITION: [number, number, number] = [-6, 1.0, 4]
export const PLAYER_STAR_RADIUS = 0.55
export const PLAYER_STAR_TEMPERATURE = 0.42  // G-type, matches T1 Sun

// Roche Lobe Overflow companion — a smaller K-type sitting close to
// the player star, just barely beyond its bloom halo. Eventually this
// will appear via Binary Partner; for now it's gated on RLO level > 0
// inside the RocheLobeOverflow component.
export const COMPANION_STAR_POSITION: [number, number, number] = [-3.0, 1.4, 3.0]
export const COMPANION_STAR_RADIUS   = 0.28
export const COMPANION_STAR_TEMP     = 0.30  // warm K-type

// Peculiar Velocity — the player star's drift direction relative to
// the Local Standard of Rest. A single tracer attached to the player.
// Direction vector picked to point up-right-slightly-back so it's
// clearly visible from the default camera angle. The warm magenta
// color is deliberately distinct from the pale-blue Stellar Kinematics
// tracers and the cyan Local Bubble rim so the player can tell which
// upgrade they're seeing.
export const PECULIAR_VELOCITY_DIRECTION: [number, number, number] = [0.55, 0.65, -0.30]
export const PECULIAR_VELOCITY_COLOR = new THREE.Color(0.95, 0.45, 0.92)
export const PECULIAR_VELOCITY_LENGTH = 6.0
export const PECULIAR_VELOCITY_RADIUS = 0.055

export interface FieldStar {
  position: [number, number, number]
  radius: number
  temperature: number
  planets: MiniPlanetProps[]
}

// Compressed-Sol mini-system for the player star: hot rocky inner,
// banded Earth-ish, banded gas giant.
export const PLAYER_PLANETS: MiniPlanetProps[] = [
  {
    orbitRadius: 1.05, orbitPeriod: 9, radius: 0.055,
    initialAngle: 0.4, inclination: 0.05,
    colorA: '#3a1808', colorB: '#a85838', colorC: '#e0a060',
    banded: 0, noiseScale: 4.6, brightness: 1.0,
    showOrbitRing: true, ringColor: '#5a4a36', ringOpacity: 0.16,
  },
  {
    orbitRadius: 1.55, orbitPeriod: 18, radius: 0.065,
    initialAngle: 2.1, inclination: 0.02,
    colorA: '#0c2848', colorB: '#3878a8', colorC: '#d8e8f0',
    banded: 0.25, noiseScale: 3.6, brightness: 1.0,
    showOrbitRing: true, ringColor: '#3a4858', ringOpacity: 0.16,
  },
  {
    orbitRadius: 2.25, orbitPeriod: 38, radius: 0.090,
    initialAngle: 4.8, inclination: -0.08,
    colorA: '#5a3a20', colorB: '#c89868', colorC: '#f0d8a8',
    banded: 1.0, noiseScale: 3.0, brightness: 0.95,
    showOrbitRing: true, ringColor: '#4a4030', ringOpacity: 0.18,
  },
]

// Realistic local-volume spectral mix: M dwarfs commonest (~75% of stars
// in reality), thinning toward K/G/F/A, with one rare B/O outlier.
// Radii scale roughly with spectral class. Temperatures span 0.10 → 0.95.
export const FIELD_STARS: FieldStar[] = [
  // M dwarf — common, dim, deep red
  {
    position: [-18,   2,  -8], radius: 0.18, temperature: 0.10,
    planets: [
      { orbitRadius: 0.40, orbitPeriod: 4, radius: 0.025, initialAngle: 1.8,
        colorA: '#1a0808', colorB: '#5a2818', colorC: '#a85838',
        banded: 0, noiseScale: 4.0, brightness: 0.9 },
    ],
  },
  // Cold M, tight planet
  {
    position: [ 12,   8, -32], radius: 0.20, temperature: 0.17,
    planets: [
      { orbitRadius: 0.42, orbitPeriod: 6, radius: 0.032, initialAngle: 2.0,
        colorA: '#180a06', colorB: '#683820', colorC: '#b86840',
        banded: 0, noiseScale: 4.4, brightness: 0.9 },
    ],
  },
  // Cool M with a pair
  {
    position: [-28,   6,  -4], radius: 0.22, temperature: 0.22,
    planets: [
      { orbitRadius: 0.45, orbitPeriod: 5, radius: 0.035, initialAngle: 2.7,
        colorA: '#2a1408', colorB: '#a05038', colorC: '#d8a878',
        banded: 0, noiseScale: 4.6, brightness: 0.95, inclination: 0.12 },
      { orbitRadius: 0.78, orbitPeriod: 16, radius: 0.042, initialAngle: 4.4,
        colorA: '#1a1414', colorB: '#605040', colorC: '#a89888',
        banded: 0, noiseScale: 4.2, brightness: 0.85 },
    ],
  },
  // K warm, three-planet system
  {
    position: [  6,  -8,  26], radius: 0.30, temperature: 0.35,
    planets: [
      { orbitRadius: 0.80, orbitPeriod: 11, radius: 0.038, initialAngle: 0.9,
        colorA: '#3a2010', colorB: '#b08068', colorC: '#e8c898',
        banded: 0, noiseScale: 4.0, brightness: 0.95, inclination: -0.05 },
      { orbitRadius: 1.30, orbitPeriod: 22, radius: 0.048, initialAngle: 2.6,
        colorA: '#10283c', colorB: '#5878a0', colorC: '#c8d8e8',
        banded: 0.4, noiseScale: 3.4, brightness: 0.95,
        showOrbitRing: true, ringOpacity: 0.12 },
      { orbitRadius: 1.90, orbitPeriod: 44, radius: 0.058, initialAngle: 5.3,
        colorA: '#102a48', colorB: '#5078b0', colorC: '#a0c0e0',
        banded: 0.9, noiseScale: 2.8, brightness: 0.85, inclination: 0.08 },
    ],
  },
  // Mid-distance K with a Jupiter-ish outer
  {
    position: [ -4,  -6,  34], radius: 0.28, temperature: 0.40,
    planets: [
      { orbitRadius: 0.85, orbitPeriod: 13, radius: 0.038, initialAngle: 5.4,
        colorA: '#2a1a10', colorB: '#a87858', colorC: '#e8b890',
        banded: 0, noiseScale: 4.0, brightness: 0.95 },
      { orbitRadius: 1.75, orbitPeriod: 40, radius: 0.075, initialAngle: 0.7,
        colorA: '#4a2808', colorB: '#c89060', colorC: '#f0d098',
        banded: 1.0, noiseScale: 3.0, brightness: 0.95,
        showOrbitRing: true, ringOpacity: 0.16, inclination: -0.04 },
    ],
  },
  // Distant G, two planets
  {
    position: [ 36,   3, -28], radius: 0.32, temperature: 0.52,
    planets: [
      { orbitRadius: 0.65, orbitPeriod: 9, radius: 0.035, initialAngle: 1.7,
        colorA: '#28180c', colorB: '#a07858', colorC: '#d8b890',
        banded: 0, noiseScale: 4.2, brightness: 0.95 },
      { orbitRadius: 1.10, orbitPeriod: 24, radius: 0.045, initialAngle: 4.1,
        colorA: '#0c2030', colorB: '#5078a0', colorC: '#c8d8e8',
        banded: 0.3, noiseScale: 3.6, brightness: 0.95 },
    ],
  },
  // G sun-like
  {
    position: [-14,  -3, -26], radius: 0.32, temperature: 0.58,
    planets: [
      { orbitRadius: 0.75, orbitPeriod: 14, radius: 0.038, initialAngle: 5.1,
        colorA: '#28140c', colorB: '#a06848', colorC: '#e8b890',
        banded: 0, noiseScale: 4.2, brightness: 0.95 },
    ],
  },
  // F at depth, banded outer
  {
    position: [-34,  -4,  18], radius: 0.38, temperature: 0.68,
    planets: [
      { orbitRadius: 1.40, orbitPeriod: 32, radius: 0.058, initialAngle: 3.0,
        colorA: '#48301a', colorB: '#c89868', colorC: '#f0d8b0',
        banded: 0.85, noiseScale: 2.8, brightness: 0.95,
        showOrbitRing: true, ringOpacity: 0.15, inclination: 0.07 },
    ],
  },
  // Big F with two companions
  {
    position: [ 22,   4, -10], radius: 0.42, temperature: 0.74,
    planets: [
      { orbitRadius: 0.85, orbitPeriod: 12, radius: 0.042, initialAngle: 1.2,
        colorA: '#2a180c', colorB: '#a07858', colorC: '#e0b890',
        banded: 0, noiseScale: 4.0, brightness: 0.95 },
      { orbitRadius: 1.55, orbitPeriod: 28, radius: 0.055, initialAngle: 3.8,
        colorA: '#10283c', colorB: '#5078a0', colorC: '#c8d8e8',
        banded: 0.4, noiseScale: 3.2, brightness: 0.95, inclination: 0.1,
        showOrbitRing: true, ringOpacity: 0.12 },
    ],
  },
  // A-type, hot inner world
  {
    position: [ 28,   5,  32], radius: 0.48, temperature: 0.85,
    planets: [
      { orbitRadius: 0.95, orbitPeriod: 8, radius: 0.045, initialAngle: 3.2,
        colorA: '#3a1810', colorB: '#c87038', colorC: '#f0c878',
        banded: 0, noiseScale: 3.8, brightness: 1.0 },
    ],
  },
  // Hot A
  {
    position: [ 30,  -5,  14], radius: 0.50, temperature: 0.90,
    planets: [
      { orbitRadius: 1.00, orbitPeriod: 7, radius: 0.052, initialAngle: 0.6,
        colorA: '#481810', colorB: '#c84818', colorC: '#f0a060',
        banded: 0, noiseScale: 3.8, brightness: 1.0 },
    ],
  },
  // Rare B/O — striking blue-white outlier
  {
    position: [ 38,  -2, -22], radius: 0.55, temperature: 0.95,
    planets: [
      { orbitRadius: 1.20, orbitPeriod: 6, radius: 0.055, initialAngle: 4.0,
        colorA: '#481408', colorB: '#c83820', colorC: '#f08858',
        banded: 0, noiseScale: 3.6, brightness: 1.0 },
    ],
  },
]

// Microlensing lens pool — player + every field star. Each event picks
// one at random; ring is sized to ~2× the chosen lens star's radius.
export const MICROLENS_TARGETS: MicrolensTarget[] = [
  { position: PLAYER_STAR_POSITION, radius: PLAYER_STAR_RADIUS },
  ...FIELD_STARS.map(s => ({ position: s.position, radius: s.radius })),
]

// Moving Group members — five field stars that share a common space
// velocity. Hand-picked to spread across the frame so the synchronized
// tracers read as a pattern hidden in the field. Positions sourced
// from FIELD_STARS by world coordinates.
export const MOVING_GROUP_TARGETS: MovingGroupMember[] = [
  { position: [-18,  2,  -8], radius: 0.18 },
  { position: [ 22,  4, -10], radius: 0.42 },
  { position: [  6, -8,  26], radius: 0.30 },
  { position: [-14, -3, -26], radius: 0.32 },
  { position: [-28,  6,  -4], radius: 0.22 },
]
export const MOVING_GROUP_DIRECTION: [number, number, number] = [0.6, 0.3, -0.5]

// Wolf-Rayet host indices in FIELD_STARS — the hottest, most massive
// members of the field. Each Wolf-Rayet level promotes the next host
// (in this order) by bumping its radius, pushing it toward hot blue,
// and tripling its prominence/wind-plume scale.
//   Index 11 = [38, -2, -22], temp 0.95 (B/O) — L1
//   Index 10 = [30, -5,  14], temp 0.90 (hot A) — L2
//   Index  9 = [28,  5,  32], temp 0.85 (hot A) — L3
export const WOLF_RAYET_HOST_INDICES = [11, 10, 9]

// ─── Controls state ────────────────────────────────────────────────────
//
// 4 high-cap stackables snap to checkpoints 0/10/25/50/99.
// Brown Dwarf (max 5) and Wolf-Rayet (max 3) are continuous 0..N.
// 4 one-shots are booleans.

export interface T2Controls {
  stellarKinematics: number
  localBubble: number
  microlensing: number
  rocheLobeOverflow: number
  brownDwarf: number
  binaryPartner: boolean
  peculiarVelocity: boolean
  openCluster: boolean
  movingGroup: boolean
  wolfRayetStar: number
}

export const DEFAULT_CONTROLS: T2Controls = {
  stellarKinematics: 0,
  localBubble: 0,
  microlensing: 0,
  rocheLobeOverflow: 0,
  brownDwarf: 0,
  binaryPartner: false,
  peculiarVelocity: false,
  openCluster: false,
  movingGroup: false,
  wolfRayetStar: 0,
}

export const HIGH_CAP_CHECKPOINTS = [0, 10, 25, 50, 99]
export const BROWN_DWARF_STEPS = [0, 1, 2, 3, 4, 5]
export const WOLF_RAYET_STEPS = [0, 1, 2, 3]

export function T2Scene({ resetVersion = 0 }: T2SceneProps) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null)
  const [c, setC] = useState<T2Controls>(DEFAULT_CONTROLS)
  // Remember last non-zero level for stackables so the toggle can restore it.
  const lastLevelRef = useRef<Partial<Record<keyof T2Controls, number>>>({})

  const setStackable = (key: keyof T2Controls, level: number) => {
    if (level > 0) lastLevelRef.current[key] = level
    setC(prev => ({ ...prev, [key]: level }))
  }

  const toggleStackable = (key: keyof T2Controls, defaultOn: number) => {
    setC(prev => {
      const current = prev[key] as number
      if (current > 0) {
        return { ...prev, [key]: 0 }
      } else {
        const restored = lastLevelRef.current[key] ?? defaultOn
        return { ...prev, [key]: restored }
      }
    })
  }

  // Local Bubble level thins the base dust haze (Phase A: scaffold; Phase B
  // will mount LocalBubble.tsx alongside). 0 levels → full dust; 99 levels
  // → ~30% dust. Linear interpolation for now.
  const dustDensity = 1.0 - (c.localBubble / 99) * 0.7

  return (
    <>
      <Canvas
        camera={{ position: [0, 8, 52], fov: 55 }}
        dpr={[1, 2]}
        gl={{ antialias: true }}
      >
        <color attach="background" args={['#000']} />
        <MilkyWayBand />
        <DeepStarfield />
        <MidStarfield />
        {/* Distant emission nebula — local-volume scenery. Placed off the
            galactic plane so it doesn't overlap MilkyWayBand. */}
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

        {/* Player star — off-center, sun-like, carried from T1.
            Full T1-style prominences + coronal loops scaled to the
            smaller radius. Mini-Sol planets orbit the home star so
            the T1 → T2 transition reads as "you zoomed out but
            brought your home with you." */}
        <group position={PLAYER_STAR_POSITION}>
          <Star radius={PLAYER_STAR_RADIUS} temperature={PLAYER_STAR_TEMPERATURE} />
          {/* Large slow prominences */}
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
          {/* Tight coronal loops */}
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
          {PLAYER_PLANETS.map((p, i) => (
            <MiniPlanet key={i} {...p} />
          ))}
          {/* Peculiar Velocity — drift indicator on the player's star.
              Mounted inside the player group so it travels with the
              player. Warm magenta = distinct from Stellar Kinematics
              and Local Bubble. */}
          {c.peculiarVelocity && (
            <KinematicsTracer
              direction={PECULIAR_VELOCITY_DIRECTION}
              length={PECULIAR_VELOCITY_LENGTH}
              radius={PECULIAR_VELOCITY_RADIUS}
              startOffset={PLAYER_STAR_RADIUS}
              color={PECULIAR_VELOCITY_COLOR}
            />
          )}
        </group>

        {/* Sparse field — "a scattering of stars finds us". Each star
            carries 0–3 of its own tiny planets at compressed orbital
            radii so the field reads as a population of places, not
            just markers. FieldStarSystem also handles per-star scintillation
            (independent gentle brightness wobble) and oscillatory bobbing
            (each system moves on a slow 3D Lissajous around its anchor)
            so the field reads as alive without any star actually drifting. */}
        {FIELD_STARS.map((s, i) => {
          // A field star becomes a Wolf-Rayet when its index falls in
          // the first `c.wolfRayetStar` entries of WOLF_RAYET_HOST_INDICES.
          const wolfRayetActive = WOLF_RAYET_HOST_INDICES
            .slice(0, c.wolfRayetStar)
            .includes(i)
          return (
            <FieldStarSystem
              key={i}
              position={s.position}
              radius={s.radius}
              temperature={s.temperature}
              seed={i + 1}
              planets={s.planets}
              kinematicsLevel={c.stellarKinematics}
              wolfRayetActive={wolfRayetActive}
            />
          )
        })}

        {/*
          Phase B upgrade components mount here, conditional on T2Controls.
          (Stellar Kinematics is wired in per-FieldStarSystem above so its
          tracer can bob with each star.)
        */}
        {c.localBubble > 0 && (
          <LocalBubble level={c.localBubble} center={PLAYER_STAR_POSITION} />
        )}
        {c.microlensing > 0 && (
          <Microlensing lensStars={MICROLENS_TARGETS} level={c.microlensing} />
        )}
        {/* Binary Partner — the companion star appears once Binary Partner
            is purchased. Uses FieldStarSystem so the companion gets
            prominences like other field stars, but with bobAmplitude=0
            (a gravity-bound partner doesn't drift independently). */}
        {c.binaryPartner && (
          <FieldStarSystem
            position={COMPANION_STAR_POSITION}
            radius={COMPANION_STAR_RADIUS}
            temperature={COMPANION_STAR_TEMP}
            brightness={1.4}
            seed={99}
            bobAmplitude={0}
          />
        )}
        {/* Roche Lobe Overflow — gated on Binary Partner. The mass stream
            requires a companion to flow toward; without one, no effect. */}
        {c.binaryPartner && c.rocheLobeOverflow > 0 && (
          <RocheLobeOverflow
            accretorPos={PLAYER_STAR_POSITION}
            accretorRadius={PLAYER_STAR_RADIUS}
            donorPos={COMPANION_STAR_POSITION}
            donorRadius={COMPANION_STAR_RADIUS}
            level={c.rocheLobeOverflow}
          />
        )}
        {c.brownDwarf > 0 && <BrownDwarfs level={c.brownDwarf} />}
        {c.openCluster && <OpenCluster />}
        {c.movingGroup && (
          <MovingGroup
            stars={MOVING_GROUP_TARGETS}
            direction={MOVING_GROUP_DIRECTION}
          />
        )}
        {/* Wolf-Rayet wiring is per-FieldStarSystem above — host stars
            get wolfRayetActive=true which bumps radius, hot-shifts the
            temperature, and triples their prominence plumes. */}

        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.08}
          enablePan
        />
        <CameraResetWatcher version={resetVersion} controlsRef={controlsRef} />
        <Bloom strength={0.55} radius={0.65} threshold={0.42} />
      </Canvas>

      <T2ControlsPanel
        controls={c}
        setStackable={setStackable}
        toggleStackable={toggleStackable}
        setBoolean={(key, value) => setC(prev => ({ ...prev, [key]: value }))}
        nudgeStackable={(key, delta, min, max) => {
          setC(prev => {
            const v = prev[key]
            if (typeof v === 'boolean') return prev
            const next = Math.max(min, Math.min(max, v + delta))
            if (next > 0) lastLevelRef.current[key] = next
            return { ...prev, [key]: next }
          })
        }}
        onReset={() => {
          setC(DEFAULT_CONTROLS)
          lastLevelRef.current = {}
        }}
      />
    </>
  )
}

// ─── Controls panel UI ─────────────────────────────────────────────────

export interface PanelProps {
  controls: T2Controls
  setStackable: (key: keyof T2Controls, level: number) => void
  toggleStackable: (key: keyof T2Controls, defaultOn: number) => void
  setBoolean: (key: keyof T2Controls, value: boolean) => void
  /** Functional updater for stackables — avoids stale-closure bugs in
   *  rapid-fire +/- clicking. min/max clamped by the caller. */
  nudgeStackable?: (key: keyof T2Controls, delta: number, min: number, max: number) => void
  onReset: () => void
}

export function T2ControlsPanel({
  controls,
  setStackable,
  toggleStackable,
  setBoolean,
  nudgeStackable,
  onReset,
}: PanelProps) {
  const [collapsed, setCollapsed] = useState(false)
  return (
    <div className={`spike-controls-panel ${collapsed ? 'collapsed' : ''}`}>
      <button
        className="panel-title"
        onClick={() => setCollapsed(c => !c)}
        title={collapsed ? 'Show controls' : 'Hide controls'}
      >
        <span>T2 Upgrades</span>
        <span className="panel-chevron">{collapsed ? '▸' : '▾'}</span>
      </button>

      {collapsed ? null : <>

      <div className="panel-section">Stackables</div>

      <StackableRow
        label="Stellar Kinematics"
        steps={HIGH_CAP_CHECKPOINTS}
        level={controls.stellarKinematics}
        defaultOn={10}
        onToggle={() => toggleStackable('stellarKinematics', 10)}
        onSet={n => setStackable('stellarKinematics', n)}
        onNudge={d => nudgeStackable?.('stellarKinematics', d, 0, 99)}
      />
      <StackableRow
        label="Local Bubble"
        steps={HIGH_CAP_CHECKPOINTS}
        level={controls.localBubble}
        defaultOn={10}
        onToggle={() => toggleStackable('localBubble', 10)}
        onSet={n => setStackable('localBubble', n)}
        onNudge={d => nudgeStackable?.('localBubble', d, 0, 99)}
      />
      <StackableRow
        label="Microlensing"
        steps={HIGH_CAP_CHECKPOINTS}
        level={controls.microlensing}
        defaultOn={10}
        onToggle={() => toggleStackable('microlensing', 10)}
        onSet={n => setStackable('microlensing', n)}
        onNudge={d => nudgeStackable?.('microlensing', d, 0, 99)}
      />
      <StackableRow
        label="Roche Lobe Overflow"
        steps={HIGH_CAP_CHECKPOINTS}
        level={controls.rocheLobeOverflow}
        defaultOn={10}
        onToggle={() => toggleStackable('rocheLobeOverflow', 10)}
        onSet={n => setStackable('rocheLobeOverflow', n)}
        onNudge={d => nudgeStackable?.('rocheLobeOverflow', d, 0, 99)}
      />
      <StackableRow
        label="Brown Dwarf"
        steps={BROWN_DWARF_STEPS}
        level={controls.brownDwarf}
        defaultOn={1}
        onToggle={() => toggleStackable('brownDwarf', 1)}
        onSet={n => setStackable('brownDwarf', n)}
        onNudge={d => nudgeStackable?.('brownDwarf', d, 0, 5)}
      />
      <StackableRow
        label="Wolf-Rayet Star"
        steps={WOLF_RAYET_STEPS}
        level={controls.wolfRayetStar}
        defaultOn={1}
        onToggle={() => toggleStackable('wolfRayetStar', 1)}
        onSet={n => setStackable('wolfRayetStar', n)}
        onNudge={d => nudgeStackable?.('wolfRayetStar', d, 0, 3)}
      />

      <div className="panel-section">One-shots</div>

      <BooleanRow
        label="Binary Partner"
        value={controls.binaryPartner}
        onChange={v => setBoolean('binaryPartner', v)}
      />
      <BooleanRow
        label="Peculiar Velocity"
        value={controls.peculiarVelocity}
        onChange={v => setBoolean('peculiarVelocity', v)}
      />
      <BooleanRow
        label="Open Cluster"
        value={controls.openCluster}
        onChange={v => setBoolean('openCluster', v)}
      />
      <BooleanRow
        label="Moving Group"
        value={controls.movingGroup}
        onChange={v => setBoolean('movingGroup', v)}
      />

      <button className="panel-reset" onClick={onReset}>Reset all</button>

      </>}
    </div>
  )
}

interface StackableRowProps {
  label: string
  steps: number[]
  level: number
  defaultOn: number
  onToggle: () => void
  onSet: (n: number) => void
  /** Optional functional nudge — preferred for +/- so rapid clicks
   *  don't suffer the stale-closure problem of `onSet(level+1)`. */
  onNudge?: (delta: number) => void
}

function StackableRow({ label, steps, level, onToggle, onSet, onNudge }: StackableRowProps) {
  const on = level > 0
  const maxStep = steps[steps.length - 1]
  const minStep = steps[0]
  // Prefer functional nudge when available so rapid clicks compose
  // correctly through React's batching.
  const decrement = () =>
    onNudge ? onNudge(-1) : onSet(Math.max(minStep, level - 1))
  const increment = () =>
    onNudge ? onNudge(+1) : onSet(Math.min(maxStep, level + 1))
  return (
    <div className="panel-row">
      <div className="row-head">
        <button className={`row-toggle ${on ? 'on' : ''}`} onClick={onToggle}>
          {label}
        </button>
        <button
          className="row-nudge"
          onClick={decrement}
          disabled={level <= minStep}
          aria-label={`${label} decrement`}
          title="−1"
        >
          −
        </button>
        <button
          className="row-nudge"
          onClick={increment}
          disabled={level >= maxStep}
          aria-label={`${label} increment`}
          title="+1"
        >
          +
        </button>
        <span className="row-level">L{level}</span>
      </div>
      <div className="row-steps">
        {steps.map(s => (
          <button
            key={s}
            className={`step ${level === s ? 'active' : ''}`}
            onClick={() => onSet(s)}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}

interface BooleanRowProps {
  label: string
  value: boolean
  onChange: (v: boolean) => void
}

function BooleanRow({ label, value, onChange }: BooleanRowProps) {
  return (
    <div className="panel-row">
      <div className="row-head">
        <button
          className={`row-toggle ${value ? 'on' : ''}`}
          onClick={() => onChange(!value)}
        >
          {label}
        </button>
      </div>
    </div>
  )
}
