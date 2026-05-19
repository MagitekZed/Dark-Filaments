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
import { MiniPlanet } from './MiniPlanet'
import { FieldStarSystem } from './FieldStarSystem'
import { LocalBubble } from './LocalBubble'
import { Microlensing } from './Microlensing'
import { RocheLobeOverflow } from './RocheLobeOverflow'
import { BrownDwarfs } from './BrownDwarfs'
import { KinematicsTracer } from './StellarKinematics'
import { OpenCluster } from './OpenCluster'
import { MovingGroup } from './MovingGroup'
import { PullParticles } from './PullParticles'
import {
  PLAYER_STAR_POSITION, PLAYER_STAR_RADIUS, PLAYER_STAR_TEMPERATURE,
  COMPANION_STAR_POSITION, COMPANION_STAR_RADIUS, COMPANION_STAR_TEMP,
  PECULIAR_VELOCITY_DIRECTION, PECULIAR_VELOCITY_COLOR,
  PECULIAR_VELOCITY_LENGTH, PECULIAR_VELOCITY_RADIUS,
  PLAYER_PLANETS, FIELD_STARS,
  MICROLENS_TARGETS, MOVING_GROUP_TARGETS, MOVING_GROUP_DIRECTION,
  WOLF_RAYET_HOST_INDICES,
  DEFAULT_CONTROLS,
  T2ControlsPanel,
  type T2Controls,
} from './T2Scene'
import { T2UIChrome } from './T2UIChrome'
import { T2NarratorSurface } from './T2NarratorSurface'

type OrbitControlsImpl = { reset: () => void }

interface T2UITestSceneProps {
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

// T2 — UI Test
//
// Same scene composition as T2Scene, plus:
//  - Edge Vignette chrome (T2UIChrome) over the Canvas.
//  - Narrator surface (T2NarratorSurface) — tier-up line on mount,
//    first-purchase fade-in per upgrade.
//  - PullParticles retargeted to the off-center player Sun.
//  - T2ControlsPanel hidden by default; press backtick or Shift+D to
//    summon for state-jump testing.
//
// State (T2Controls) is lifted here so the chrome's "Buy" actions and
// the dev panel converge on the same store.
export function T2UITestScene({ resetVersion = 0 }: T2UITestSceneProps) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null)
  const [c, setC] = useState<T2Controls>(DEFAULT_CONTROLS)
  const lastLevelRef = useRef<Partial<Record<keyof T2Controls, number>>>({})
  const [showDevPanel, setShowDevPanel] = useState(false)

  // Dev panel key-toggle: backtick or Shift+D.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Ignore if the user is typing in an input/textarea/contenteditable.
      const t = e.target as HTMLElement | null
      const tag = t?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || t?.isContentEditable) return
      if (e.key === '`' || (e.shiftKey && (e.key === 'D' || e.key === 'd'))) {
        e.preventDefault()
        setShowDevPanel(v => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

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

  const setBoolean = (key: keyof T2Controls, value: boolean) =>
    setC(prev => ({ ...prev, [key]: value }))

  // Functional updater for the dev panel's +/- buttons. Reads the
  // current level via the setter callback so rapid-fire clicks compose
  // instead of clobbering each other through React's stale-closure.
  const nudgeStackable = (key: keyof T2Controls, delta: number, min: number, max: number) => {
    setC(prev => {
      const v = prev[key]
      if (typeof v === 'boolean') return prev
      const next = Math.max(min, Math.min(max, v + delta))
      if (next > 0) lastLevelRef.current[key] = next
      return { ...prev, [key]: next }
    })
  }

  // Chrome's buy action: stackables increment by 1 (capped at maxLevels via
  // the chrome's per-card check); one-shots flip to true.
  const onBuy = (key: keyof T2Controls) => {
    setC(prev => {
      const v = prev[key]
      if (typeof v === 'boolean') return { ...prev, [key]: true }
      return { ...prev, [key]: v + 1 }
    })
  }

  // Local Bubble level thins the base dust haze — match T2Scene's
  // linear interpolation: 0 → 100% dust, 99 → ~30% dust.
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

        {/* Player star group — mini-Sol planets, prominences, coronal loops. */}
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
          {PLAYER_PLANETS.map((p, i) => (
            <MiniPlanet key={i} {...p} />
          ))}
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

        {/* Field stars (12). */}
        {FIELD_STARS.map((s, i) => {
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

        {/* Conditional upgrade components — same as T2Scene. */}
        {c.localBubble > 0 && (
          <LocalBubble level={c.localBubble} center={PLAYER_STAR_POSITION} />
        )}
        {c.microlensing > 0 && (
          <Microlensing lensStars={MICROLENS_TARGETS} level={c.microlensing} />
        )}
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

        {/* Click feedback — retargeted to the off-center player Sun. */}
        <PullParticles
          sunPosition={PLAYER_STAR_POSITION}
          absorbRadius={PLAYER_STAR_RADIUS * 1.6}
          minSpawnRadius={PLAYER_STAR_RADIUS * 3.5}
          particleSize={0.08}
        />

        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.08}
          enablePan
        />
        <CameraResetWatcher version={resetVersion} controlsRef={controlsRef} />
        <Bloom strength={0.55} radius={0.65} threshold={0.42} />
      </Canvas>

      <T2UIChrome controls={c} onBuy={onBuy} />
      <T2NarratorSurface controls={c} />

      {showDevPanel && (
        <T2ControlsPanel
          controls={c}
          setStackable={setStackable}
          toggleStackable={toggleStackable}
          setBoolean={setBoolean}
          nudgeStackable={nudgeStackable}
          onReset={() => {
            setC(DEFAULT_CONTROLS)
            lastLevelRef.current = {}
          }}
        />
      )}
    </>
  )
}
