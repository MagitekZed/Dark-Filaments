import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Star } from './Star'
import { PlasmaArcs } from './PlasmaArcs'
import { WolfRayetPlumes } from './WolfRayetPlumes'
import { MiniPlanet, type MiniPlanetProps } from './MiniPlanet'
import {
  KinematicsTracer,
  hashKinematicsDirection,
  kinematicsForLevel,
} from './StellarKinematics'

interface FieldStarSystemProps {
  /** Anchor position. The system bobs around this. */
  position: [number, number, number]
  radius: number
  temperature: number
  brightness?: number
  /** Deterministic seed for scintillation phase + bobbing phase per axis. */
  seed: number
  /** Bobbing amplitude in scene units. Default ~0.18 (very subtle). */
  bobAmplitude?: number
  planets?: MiniPlanetProps[]
  /** Stellar Kinematics upgrade level (0..99). When > 0 the system
   *  renders a soft-fade motion-vector tracer attached to the star
   *  core, bobbing with it. */
  kinematicsLevel?: number
  /** When true, this star is hosting a Wolf-Rayet — bumps its radius,
   *  pushes the temperature toward hot blue, and triples the size +
   *  density of the prominence/wind plumes. */
  wolfRayetActive?: boolean
}

// Wraps a Star + its planets in a group whose position oscillates around
// the anchor `position` via three independent slow sine waves on x/y/z.
// The motion is oscillatory (returns to origin) and very small, so it
// reads as the field being "alive" without becoming proper motion —
// which is reserved for the Stellar Kinematics upgrade.
//
// Periods (45s/63s/81s, irrational ratios) and starting phases are
// derived from the integer `seed` so the same star always bobs the same
// way across renders and the systems are clearly not in sync with each
// other.

function pseudoRandom(seed: number, salt: number): number {
  // small deterministic hash → [0, 1)
  const x = Math.sin(seed * 374.761 + salt * 51.937) * 43758.5453
  return x - Math.floor(x)
}

// Wolf-Rayet activation transition timings. Three sequential phases so
// each beat reads as its own moment:
//   1. Color phase (0 → WR_COLOR_END_S): temperature lerps baseline → WR.
//      Star size + brightness untouched. Reads as "the surface is shifting
//      toward blue."
//   2. Brightness/size phase (WR_COLOR_END_S → WR_GROWTH_END_S): brightness
//      AND scale lerp baseline → WR. Star is already at WR temperature
//      from phase 1, so this reads as "the now-hot star ignites and grows."
//   3. Plume phase (WR_GROWTH_END_S onward): plumes mount fresh-start (each
//      starting at age=0, sweeping outward from the surface foot). No pop.
const WR_COLOR_END_S = 1.5
const WR_GROWTH_END_S = 3.5
const WR_PLUME_DELAY_S = WR_GROWTH_END_S

// Pick hot/cool prominence palette per spectral class.
// 0 = deep red M dwarf, 1 = blue-white B/O.
function prominencePalette(temperature: number): { hot: string; cool: string } {
  if (temperature < 0.25) return { hot: '#ffcc70', cool: '#8a1808' }     // red dwarf — warm
  if (temperature < 0.45) return { hot: '#ffe080', cool: '#a82008' }     // K orange
  if (temperature < 0.60) return { hot: '#fff0c0', cool: '#a82418' }     // G sun-like (matches T1)
  if (temperature < 0.78) return { hot: '#fff8e8', cool: '#c04830' }     // F white
  if (temperature < 0.92) return { hot: '#e8f0ff', cool: '#5070c0' }     // A blue-white
  return { hot: '#d8e4ff', cool: '#3858b0' }                              // B/O hot blue
}

export function FieldStarSystem({
  position,
  radius,
  temperature,
  brightness = 1.6,
  seed,
  bobAmplitude = 0.18,
  planets = [],
  kinematicsLevel = 0,
  wolfRayetActive = false,
}: FieldStarSystemProps) {
  // Wolf-Rayet modifiers — applied to the star + prominences. The
  // star itself is bumped substantially larger, pushed all the way
  // to hot blue, and brightened. The prominence scaffolding is
  // reused but reshaped into FEWER, BIGGER, MORE DIRECTED plumes
  // (heights × 7 — dramatic spray, particle counts × 6 per arc,
  // particle sizes × 2.2, arc count × 0.4 — fewer but each one huge)
  // so the stellar-wind plumes read as the dominant visual signature.
  //
  // Activation transition: when wolfRayetActive flips false→true, the
  // visible star scales up from `baseRadius` to `effRadius` over
  // WR_GROWTH_DURATION_S. The plumes are delay-mounted at
  // WR_PLUME_DELAY_S so they appear a beat after the brightening.
  // Toggling off is instant (no reverse transition needed — the real
  // game has no reverse progress).
  const effRadius = wolfRayetActive ? radius * 1.55 : radius
  const effTemp = wolfRayetActive ? Math.min(1.0, temperature + 0.10) : temperature
  const effBrightness = wolfRayetActive ? brightness * 1.5 : brightness
  const promArcScale = wolfRayetActive ? 0.4 : 1.0   // fewer, more directed
  const groupRef = useRef<THREE.Group>(null)
  // Wrapper group whose scale animates from (radius/effRadius) → 1 during
  // the brightness/size phase of WR activation.
  const wrScaleGroupRef = useRef<THREE.Group>(null)
  const wrActivationStart = useRef<number | null>(null)
  // Per-frame Star overrides — driven by the WR transition useFrame.
  // null = no override (Star uses its prop normally). When WR is active,
  // these get written each frame with the current lerp value so the
  // surface temperature and brightness animate without re-rendering Star.
  const tempOverrideRef = useRef<number | null>(null)
  const brightnessOverrideRef = useRef<number | null>(null)
  const [plumesVisible, setPlumesVisible] = useState(false)
  const t = useRef(pseudoRandom(seed, 1) * 30)  // stagger initial offset so every star isn't at t=0

  const bobParams = useMemo(() => ({
    px: pseudoRandom(seed, 1) * Math.PI * 2,
    py: pseudoRandom(seed, 2) * Math.PI * 2,
    pz: pseudoRandom(seed, 3) * Math.PI * 2,
    // amplitude jitter so each star has its own footprint
    ax: bobAmplitude * (0.8 + pseudoRandom(seed, 4) * 0.5),
    ay: bobAmplitude * 0.6 * (0.8 + pseudoRandom(seed, 5) * 0.5),
    az: bobAmplitude * (0.8 + pseudoRandom(seed, 6) * 0.5),
  }), [seed, bobAmplitude])

  const scintParams = useMemo(() => ({
    amplitude: 0.08 + pseudoRandom(seed, 7) * 0.06,  // ±8–14%
    period: 5 + pseudoRandom(seed, 8) * 8,           // 5–13s
    phase: pseudoRandom(seed, 9) * Math.PI * 2,
  }), [seed])

  useFrame((_, delta) => {
    t.current += delta
    if (groupRef.current) {
      const time = t.current
      // three independent slow sine waves, irrational period ratios
      const dx = Math.sin((time / 45) * Math.PI * 2 + bobParams.px) * bobParams.ax
      const dy = Math.sin((time / 63) * Math.PI * 2 + bobParams.py) * bobParams.ay
      const dz = Math.sin((time / 81) * Math.PI * 2 + bobParams.pz) * bobParams.az
      groupRef.current.position.set(
        position[0] + dx,
        position[1] + dy,
        position[2] + dz,
      )
    }
    // WR three-phase activation. Star renders at WR-target values (radius,
    // temperature, brightness) from the moment of activation, but each
    // gets a per-frame override that lerps from baseline to target across
    // its own phase window:
    //   Phase 1 (0 → WR_COLOR_END_S):     uTemperature lerps base → effTemp
    //   Phase 2 (WR_COLOR_END_S → WR_GROWTH_END_S):
    //                                     uBrightness lerps base → effBright
    //                                     wrScaleGroup scales (base/eff) → 1
    //   Phase 3 (WR_GROWTH_END_S onward): plumes mount fresh-start
    if (wolfRayetActive && wrActivationStart.current !== null) {
      const wrAge = t.current - wrActivationStart.current
      // Phase 1: temperature
      const p1 = Math.max(0, Math.min(1, wrAge / WR_COLOR_END_S))
      const p1Eased = p1 * p1 * (3 - 2 * p1)
      tempOverrideRef.current = temperature + (effTemp - temperature) * p1Eased
      // Phase 2: brightness + scale (only starts once phase 1 ends)
      const phase2Age = Math.max(0, wrAge - WR_COLOR_END_S)
      const phase2Dur = WR_GROWTH_END_S - WR_COLOR_END_S
      const p2 = Math.max(0, Math.min(1, phase2Age / phase2Dur))
      const p2Eased = p2 * p2 * (3 - 2 * p2)
      brightnessOverrideRef.current = brightness + (effBrightness - brightness) * p2Eased
      if (wrScaleGroupRef.current) {
        const startScale = radius / effRadius
        const scale = startScale + (1 - startScale) * p2Eased
        wrScaleGroupRef.current.scale.setScalar(scale)
      }
    } else {
      // Not active — release the overrides so Star uses its props normally.
      tempOverrideRef.current = null
      brightnessOverrideRef.current = null
      if (wrScaleGroupRef.current) wrScaleGroupRef.current.scale.setScalar(1)
    }
  })

  // WR activation lifecycle. On false→true, stamp the activation time
  // and schedule plume mount after WR_PLUME_DELAY_S. On true→false,
  // snap everything back (no reverse transition).
  useEffect(() => {
    if (wolfRayetActive) {
      wrActivationStart.current = t.current
      const timer = window.setTimeout(
        () => setPlumesVisible(true),
        WR_PLUME_DELAY_S * 1000,
      )
      return () => window.clearTimeout(timer)
    } else {
      wrActivationStart.current = null
      setPlumesVisible(false)
    }
  }, [wolfRayetActive])

  const palette = useMemo(() => prominencePalette(effTemp), [effTemp])
  // Light prominence budget per star — particle count scales modestly with
  // star size so M dwarfs don't get the same activity as A-types.
  // When Wolf-Rayet is active, the arc count is bumped 50% on top.
  const promScale = Math.max(0.7, effRadius / 0.4)
  const largeArcs = Math.round(4 * promScale * promArcScale)
  const tightArcs = Math.round(7 * promScale * promArcScale)

  // Stable per-star motion direction for the Stellar Kinematics tracer.
  const kinematicsDirection = useMemo(
    () => hashKinematicsDirection(seed * 31 + 17),
    [seed],
  )
  const kinematicsSize = useMemo(
    () => kinematicsForLevel(kinematicsLevel),
    [kinematicsLevel],
  )

  return (
    <group ref={groupRef} position={position}>
      {/* WR scale-animation wrapper. When WR is inactive, scale is 1.0
          and the Star/plumes group renders normally. When WR activates,
          the wrapper grows from (baseRadius/effRadius) to 1.0 over the
          first 4 seconds — making the otherwise-instant size jump read
          as a brightening growth. */}
      <group ref={wrScaleGroupRef}>
      <Star
        radius={effRadius}
        temperature={effTemp}
        brightness={effBrightness}
        scintillation={scintParams}
        tempOverrideRef={tempOverrideRef}
        brightnessOverrideRef={brightnessOverrideRef}
      />

      {wolfRayetActive ? (
        // Wolf-Rayet plumes — 3 long-lived plumes that grow from one
        // surface foot to another over 10–20 s, with path wobble and
        // width variance. Replaces the standard prominences when WR
        // is active. Delay-mounted at WR_PLUME_DELAY_S so they emerge
        // a beat after the star starts brightening; their internal
        // initEnvelope handles the per-plume fade-in from the surface.
        plumesVisible && (
        <WolfRayetPlumes
          starRadius={effRadius}
          activePlumes={3}
          lifetimeMin={10}
          lifetimeMax={20}
          particlesPerPlume={420}
          hotColor={palette.hot}
          coolColor={palette.cool}
          arcHeight={5.5}
          wobbleAmp={0.32}
          widthJitter={0.25}
          particleSize={0.30}
          freshStart
        />
        )
      ) : (
        <>
          {/* Large slow prominences */}
          <PlasmaArcs
            starRadius={effRadius}
            arcs={largeArcs}
            particlesPerArc={120}
            heightMin={1.60}
            heightMax={2.45}
            angularSpanMin={0.20}
            angularSpanMax={1.05}
            speedMin={0.030}
            speedMax={0.060}
            particleSize={0.038 * effRadius}
            hotColor={palette.hot}
            coolColor={palette.cool}
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
            starRadius={effRadius}
            arcs={tightArcs}
            particlesPerArc={60}
            heightMin={1.22}
            heightMax={1.55}
            angularSpanMin={0.10}
            angularSpanMax={0.40}
            speedMin={0.10}
            speedMax={0.18}
            particleSize={0.012 * effRadius}
            hotColor={palette.hot}
            coolColor={palette.cool}
            perpJitter={0.005}
            wobbleAmp={0.018}
            wobbleFreq={3.5}
            lifetimeMin={10}
            lifetimeMax={22}
            opacity={1.0}
          />
        </>
      )}
      </group>
      {/* End of WR scale-animation wrapper. Planets and the Kinematics
          tracer sit OUTSIDE the wrapper — they shouldn't shrink/grow
          with the host star's WR transition (they have their own
          fixed orbital geometry / proper-motion vector). */}

      {planets.map((p, i) => (
        <MiniPlanet key={i} {...p} />
      ))}

      {/* Stellar Kinematics tracer — sits inside this group so it bobs
          with the host star. startOffset = star radius so the tracer
          emerges from the photosphere rather than the geometric center. */}
      {kinematicsLevel > 0 && (
        <KinematicsTracer
          direction={kinematicsDirection}
          length={kinematicsSize.length}
          radius={kinematicsSize.radius}
          startOffset={radius}
        />
      )}
    </group>
  )
}
