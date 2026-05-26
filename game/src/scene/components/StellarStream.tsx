import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { sparkTexture } from './discTexture'

// Stellar Stream — a cold tidal stellar stream in the halo (T3 one-shots Orphan
// Stream + Sagittarius Stream).
//
// Real astronomy: when a dwarf galaxy or globular cluster orbits a larger host,
// tides strip its stars into a long, thin, kinematically cold ribbon tracing the
// progenitor's orbit. The Orphan Stream (~150 kpc long, ~2° wide) was named for
// having no obvious progenitor — a galaxy that died and left a shape. The
// Sagittarius Stream is the grandest: the ongoing disruption of the Sgr dwarf
// wraps the galaxy more than 360°, leading and trailing arms across the sky.
//
// Visual: stars laid along an arc of an orbit around the cloud center, with a
// little transverse scatter (the stream's width) and a density bias toward one
// end (the surviving progenitor). Pale and cool — a population torn from
// elsewhere, distinct from the warm resident swarm. On fresh purchase the stream
// fades in (freshStart) rather than popping into existence.

export interface StellarStreamProps {
  /** Orbit center the stream arcs around (the cloud's dark matter well). */
  center?: [number, number, number]
  /** Orbital radius of the arc. */
  radius?: number
  /** Euler orientation of the orbit plane (tilts the arc in 3D). */
  orientation?: [number, number, number]
  /** Where the visible arc starts (radians). */
  arcStart?: number
  /** Angular span of the visible arc (radians). */
  arcSpan?: number
  /** Transverse half-width of the stream (world units). */
  width?: number
  /** Number of stream stars. */
  count?: number
  /** Base color of the (cold, stripped) population. */
  color?: string
  /** Overall brightness multiplier. */
  brightness?: number
  /** Density bias toward the progenitor end (0 = uniform, 1 = strong). */
  progenitorBias?: number
  /** True on the purchase frame — fades the stream in from nothing. */
  freshStart?: boolean
  /** Deterministic seed. */
  seed?: number
}

const FADE_IN_SECONDS = 7

function hash01(x: number): number {
  const y = Math.sin(x) * 43758.5453
  return y - Math.floor(y)
}

// Approx standard-normal in [-1,1]-ish via averaged uniforms (central limit).
function gaussish(a: number, b: number, c: number): number {
  return (a + b + c) / 1.5 - 1
}

export function StellarStream({
  center = [0, 0, 0],
  radius = 24,
  orientation = [0, 0, 0],
  arcStart = 0,
  arcSpan = Math.PI,
  width = 1.4,
  count = 900,
  color = '#cfd6ec',
  brightness = 0.7,
  progenitorBias = 0.6,
  freshStart = false,
  seed = 1,
}: StellarStreamProps) {
  const texture = useMemo(() => sparkTexture(), [])
  const matRef = useRef<THREE.PointsMaterial>(null)
  const elapsed = useRef(0)

  const cx = center[0], cy = center[1], cz = center[2]
  const ox = orientation[0], oy = orientation[1], oz = orientation[2]

  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    const quat = new THREE.Quaternion().setFromEuler(new THREE.Euler(ox, oy, oz))
    const local = new THREE.Vector3()
    const base = new THREE.Color(color)
    const c = new THREE.Color()
    for (let i = 0; i < count; i++) {
      // Along-arc parameter, biased toward the progenitor end (u→0).
      const uRaw = hash01(seed * 11 + i * 1.7)
      const u = uRaw * (1 - progenitorBias) + Math.pow(uRaw, 2.2) * progenitorBias
      const theta = arcStart + u * arcSpan
      // Transverse scatter: in-plane radial + out-of-plane thickness. Slightly
      // wider toward the trailing (stripped) end.
      const spread = width * (0.6 + u * 0.8)
      const wRadial = gaussish(
        hash01(seed * 13 + i * 2.3),
        hash01(seed * 17 + i * 3.1),
        hash01(seed * 19 + i * 4.7),
      ) * spread
      const wThick = gaussish(
        hash01(seed * 23 + i * 5.3),
        hash01(seed * 29 + i * 6.1),
        hash01(seed * 31 + i * 7.9),
      ) * spread * 0.35
      const rr = radius + wRadial
      local.set(rr * Math.cos(theta), wThick, rr * Math.sin(theta))
      local.applyQuaternion(quat)
      pos[i * 3 + 0] = cx + local.x
      pos[i * 3 + 1] = cy + local.y
      pos[i * 3 + 2] = cz + local.z

      // Brightness: mostly faint, a few knots; brighter near the progenitor.
      const knot = Math.pow(hash01(seed * 37 + i * 8.3), 4) * 1.6
      const b = brightness * (0.35 + (1 - u) * 0.5 + knot)
      c.copy(base)
      col[i * 3 + 0] = c.r * b
      col[i * 3 + 1] = c.g * b
      col[i * 3 + 2] = c.b * b
    }
    return { positions: pos, colors: col }
  }, [cx, cy, cz, ox, oy, oz, radius, arcStart, arcSpan, width, count, color, brightness, progenitorBias, seed])

  // Fade in on fresh purchase; restored streams start at full opacity.
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
        size={0.6}
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
