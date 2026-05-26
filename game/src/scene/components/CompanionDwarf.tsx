import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { sparkTexture } from './discTexture'

// Companion Dwarf — a resolvable neighbouring dwarf spheroidal in the halo (T3
// one-shots Sculptor Dwarf + Draco Dwarf).
//
// Real astronomy: the classical Milky Way dSph satellites. Sculptor (~86 kpc,
// M/L ~10) is resolvable into individual stars — the first time we look at
// another galaxy and see the people in it. Draco (~80 kpc) is among the most
// dark-matter-dominated objects known (M/L up to ~440): only a sparse scatter of
// stars marks a deep, mostly-invisible mass. So `darkDominated` Draco gets FEWER
// visible stars for its extent — the visible part is the small part. Its dark
// halo is implied by a faint lensing ring the scene mounts alongside (SD-2), not
// by adding light here.
//
// Visual: a small, diffuse, warm old-star spheroid at an offset position, with a
// fresh-start fade-in. Distinct from the main body only by being smaller and
// farther.

export interface CompanionDwarfProps {
  /** Center of the companion (offset from the main cloud). */
  center: [number, number, number]
  /** Spatial half-extent. */
  radius?: number
  /** Number of resolved stars. Lower for a dark-dominated dwarf. */
  count?: number
  /** Overall brightness. */
  brightness?: number
  /** Slightly tighter, more concentrated core when true. */
  darkDominated?: boolean
  /** True on the purchase frame — fades the dwarf in. */
  freshStart?: boolean
  /** Deterministic seed. */
  seed?: number
}

const FADE_IN_SECONDS = 6

function hash01(x: number): number {
  const y = Math.sin(x) * 43758.5453
  return y - Math.floor(y)
}

// Old metal-poor palette (warm reds → amber), same family as the main body.
function oldStarColor(t: number, b: number): [number, number, number] {
  if (t < 0.4) return [b * 1.0, b * 0.46, b * 0.26]
  if (t < 0.72) return [b * 1.0, b * 0.62, b * 0.34]
  return [b * 1.0, b * 0.82, b * 0.56]
}

export function CompanionDwarf({
  center,
  radius = 4.5,
  count = 480,
  brightness = 0.7,
  darkDominated = false,
  freshStart = false,
  seed = 1,
}: CompanionDwarfProps) {
  const texture = useMemo(() => sparkTexture(), [])
  const matRef = useRef<THREE.PointsMaterial>(null)
  const elapsed = useRef(0)

  const cx = center[0], cy = center[1], cz = center[2]

  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    // Dark-dominated dwarfs are a touch more concentrated (deeper well).
    const concentration = darkDominated ? 0.85 : 0.6
    for (let i = 0; i < count; i++) {
      const r = radius * Math.pow(hash01(seed * 7 + i * 1.9), concentration)
      const phi = hash01(seed * 11 + i * 3.3) * Math.PI * 2
      const cosTheta = hash01(seed * 13 + i * 5.1) * 2 - 1
      const sinTheta = Math.sqrt(1 - cosTheta * cosTheta)
      pos[i * 3 + 0] = cx + r * sinTheta * Math.cos(phi)
      pos[i * 3 + 1] = cy + r * cosTheta * 0.78
      pos[i * 3 + 2] = cz + r * sinTheta * Math.sin(phi) * 0.92

      const t = hash01(seed * 17 + i * 2.7)
      const baseB = 0.18 + hash01(seed * 19 + i * 1.3) * 0.26
      const beacon = Math.pow(hash01(seed * 23 + i * 6.7), 5) * 0.8
      const coreBoost = 1 + (1 - r / radius) * 0.35
      const b = (baseB + beacon) * coreBoost * brightness
      const c = oldStarColor(t, b)
      col[i * 3 + 0] = c[0]
      col[i * 3 + 1] = c[1]
      col[i * 3 + 2] = c[2]
    }
    return { positions: pos, colors: col }
  }, [cx, cy, cz, radius, count, brightness, darkDominated, seed])

  useFrame((_, delta) => {
    if (!matRef.current) return
    if (!freshStart) {
      matRef.current.opacity = 0.9
      return
    }
    elapsed.current += delta
    const t = Math.min(1, elapsed.current / FADE_IN_SECONDS)
    matRef.current.opacity = 0.9 * (t * t * (3 - 2 * t))
  })

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={matRef}
        size={0.7}
        sizeAttenuation
        map={texture}
        vertexColors
        transparent
        opacity={freshStart ? 0 : 0.9}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        alphaTest={0.01}
        toneMapped={false}
      />
    </points>
  )
}
