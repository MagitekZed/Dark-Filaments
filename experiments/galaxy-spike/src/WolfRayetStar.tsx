import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Nebula } from './Nebula'

interface WolfRayetStarProps {
  /** World-space position of the host star. */
  hostPosition: [number, number, number]
  /** Host star radius — drives plume scale. */
  hostRadius: number
  /** Direction the plume extends from the host (will be normalized). */
  plumeDirection: [number, number, number]
  /** Seed for deterministic plume detail. */
  seed?: number
}

// Wolf-Rayet Star — the end-state of a >20 M☉ massive star, after
// stellar winds have stripped off the hydrogen envelope and exposed
// the hot blue-violet helium-rich core. The winds (10⁶ × Sun's)
// blow the stripped material into asymmetric shells around the star.
// Real examples: WR 124's bowshock, WR 104's spiral, Eta Carinae's
// "Homunculus." Visually the loudest things in the local volume —
// final-stage massive stars right before supernova.
//
// The host star already renders via FieldStarSystem; this component
// just adds the asymmetric plume/wind shell on top, offset to one
// side to read as a directed mass-loss event rather than a balanced
// halo. Fade-in animation drives material opacity from 0 → target
// over a random duration so the plume "blooms into being" rather
// than popping in instantly.

const FADE_DURATION_MIN = 4.0   // seconds
const FADE_DURATION_MAX = 9.0
const PLUME_TARGET_OPACITY = 0.62

export function WolfRayetStar({
  hostPosition,
  hostRadius,
  plumeDirection,
  seed = 1,
}: WolfRayetStarProps) {
  // Compute plume center: offset from host by ~1.4× host radius in
  // the given direction so the asymmetry reads — the plume sits
  // mostly on one side of the star rather than enveloping it.
  const plumePos = useMemo<[number, number, number]>(() => {
    const dir = new THREE.Vector3(
      plumeDirection[0], plumeDirection[1], plumeDirection[2],
    ).normalize()
    return [
      hostPosition[0] + dir.x * hostRadius * 1.4,
      hostPosition[1] + dir.y * hostRadius * 1.4,
      hostPosition[2] + dir.z * hostRadius * 1.4,
    ]
  }, [hostPosition, hostRadius, plumeDirection])

  // Fade duration randomised by seed.
  const fadeDuration = useMemo(() => {
    const x = Math.sin(seed * 31.7) * 43758.5
    const r = x - Math.floor(x)
    return FADE_DURATION_MIN + r * (FADE_DURATION_MAX - FADE_DURATION_MIN)
  }, [seed])

  const matRef = useRef<THREE.PointsMaterial>(null)
  const elapsed = useRef(0)

  useFrame((_, delta) => {
    elapsed.current += delta
    if (matRef.current) {
      const tt = Math.min(1, elapsed.current / fadeDuration)
      const fade = tt * tt * (3 - 2 * tt)  // smoothstep
      matRef.current.opacity = PLUME_TARGET_OPACITY * fade
    }
  })

  return (
    <Nebula
      position={plumePos}
      scale={hostRadius * 4.5}
      particleCount={650}
      subBlobs={4}
      innerColor="#f0e0ff"     // bright blue-white core (ionized helium)
      midColor="#9070d8"        // violet body (ionized nitrogen)
      outerColor="#4828a0"      // deep purple-blue outer wisps
      opacity={0}
      materialRef={matRef}
    />
  )
}
