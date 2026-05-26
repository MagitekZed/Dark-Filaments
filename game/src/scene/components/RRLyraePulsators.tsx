import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { diffractionTexture } from './discTexture'

// RR Lyrae — the T3 click upgrade visual.
//
// Real astronomy: RR Lyrae are old (>10 Gyr), metal-poor, horizontal-branch
// pulsating variables with periods of ~0.2–1.0 days. They sit on the
// instability strip — bluer and brighter than the bulk old population — and
// their light curves rise FAST and fall SLOW (the classic RRab sawtooth). Their
// well-defined luminosity makes them standard candles: each pulse is a
// measurement. That rhymes with the click — the click rhythm and the star's
// pulsation are the same act of measuring.
//
// Visual: a sparse set of pale blue-white variables embedded in the dwarf
// spheroidal, each pulsing on its own short period (the real ~0.5-day cycle
// sped up so it reads). More of them resolve as the upgrade stacks. They use a
// diffraction sparkle (cross spikes) to stand apart from the soft cloud points
// as distinct, measured beacons.

interface RRLyraePulsatorsProps {
  /** RR Lyrae upgrade level (0..99). More levels → more pulsators visible. */
  level: number
  /** Spatial half-extent the pulsators are scattered within. */
  radius?: number
}

const MAX_PULSATORS = 14

function hash01(x: number): number {
  const y = Math.sin(x) * 43758.5453
  return y - Math.floor(y)
}

// Count of visible pulsators for a level — sqrt curve (L1≈3, L25≈10, L99≈14).
function countForLevel(level: number): number {
  if (level <= 0) return 0
  const n = Math.round(2 + Math.sqrt(level) * 1.55)
  return Math.max(1, Math.min(MAX_PULSATORS, n))
}

// RRab light curve over phase p ∈ [0,1): steep rise to a sharp peak, then a
// slow decline. Returns a brightness multiplier roughly in [0.35, 1.7].
function lightCurve(p: number): number {
  if (p < 0.13) {
    // fast rise
    const t = p / 0.13
    return 0.35 + (1.7 - 0.35) * (t * t * (3 - 2 * t))
  }
  // slow decline with a faint shoulder
  const t = (p - 0.13) / 0.87
  const decline = 1.7 - (1.7 - 0.35) * Math.pow(t, 0.85)
  const shoulder = 0.10 * Math.sin(t * Math.PI) // gentle hump mid-decline
  return Math.max(0.30, decline + shoulder)
}

export function RRLyraePulsators({ level, radius = 12 }: RRLyraePulsatorsProps) {
  const texture = useMemo(() => diffractionTexture(), [])
  const geomRef = useRef<THREE.BufferGeometry>(null)

  const count = countForLevel(level)

  // Per-pulsator seeded properties (position, base color, period, phase, base
  // brightness). Baked for the visible count.
  const pulsators = useMemo(() => {
    const list: {
      pos: [number, number, number]
      base: THREE.Color
      period: number
      phase: number
      baseB: number
    }[] = []
    for (let i = 0; i < count; i++) {
      // Concentrated toward the core (where the old population is densest).
      const r = radius * Math.pow(hash01(i * 4.7 + 0.9), 0.7)
      const phi = hash01(i * 2.3 + 3.1) * Math.PI * 2
      const cosTheta = hash01(i * 6.1 + 1.4) * 2 - 1
      const sinTheta = Math.sqrt(1 - cosTheta * cosTheta)
      const pos: [number, number, number] = [
        r * sinTheta * Math.cos(phi),
        r * cosTheta * 0.72,
        r * sinTheta * Math.sin(phi) * 0.9,
      ]
      // Pale blue-white instability-strip color, slight per-star variance.
      const warm = hash01(i * 8.9 + 2.7)
      const base = new THREE.Color(
        0.78 + warm * 0.18,
        0.84 + warm * 0.10,
        1.0,
      )
      // Period 2.2–4.6 s (the ~0.2–1.0 day range, sped up to read).
      const period = 2.2 + hash01(i * 3.3 + 5.5) * 2.4
      const phase = hash01(i * 1.9 + 7.2)
      const baseB = 0.9 + hash01(i * 5.5 + 0.4) * 0.5
      list.push({ pos, base, period, phase, baseB })
    }
    return list
  }, [count, radius])

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    pulsators.forEach((p, i) => {
      arr[i * 3] = p.pos[0]
      arr[i * 3 + 1] = p.pos[1]
      arr[i * 3 + 2] = p.pos[2]
    })
    return arr
  }, [pulsators, count])

  const colors = useMemo(() => new Float32Array(count * 3), [count])
  const timeRef = useRef(0)

  useFrame((_, delta) => {
    timeRef.current += delta
    const t = timeRef.current
    for (let i = 0; i < count; i++) {
      const p = pulsators[i]
      const phase = ((t / p.period) + p.phase) % 1
      const b = p.baseB * lightCurve(phase)
      colors[i * 3] = p.base.r * b
      colors[i * 3 + 1] = p.base.g * b
      colors[i * 3 + 2] = p.base.b * b
    }
    if (geomRef.current) geomRef.current.attributes.color.needsUpdate = true
  })

  if (count === 0) return null

  return (
    <points key={count}>
      <bufferGeometry ref={geomRef}>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={2.2}
        sizeAttenuation
        map={texture}
        alphaMap={texture}
        vertexColors
        transparent
        opacity={0.95}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  )
}
