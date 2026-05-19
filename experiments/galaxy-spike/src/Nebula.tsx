import { useMemo } from 'react'
import * as THREE from 'three'
import { discTexture } from './discTexture'

interface NebulaProps {
  /** World-space center of the nebula. */
  position?: [number, number, number]
  /** Overall scale of the nebula (radius of bounding region). */
  scale?: number
  particleCount?: number
  /** Number of internal sub-blobs — gives the cloud its clumpy structure. */
  subBlobs?: number
  /** Brightest core color (typically Hα pink / star-forming region red). */
  innerColor?: string
  /** Mid-tone, gas body. */
  midColor?: string
  /** Cool outer halo (blue scattered light / reflection). */
  outerColor?: string
  /** Initial material opacity (default 0.55). */
  opacity?: number
  /** Optional ref to the pointsMaterial so external code can animate
   *  opacity directly each frame (e.g., for fade-in transitions). */
  materialRef?: React.Ref<THREE.PointsMaterial>
  /** Optional explicit seed. When provided, geometry is deterministic
   *  per-seed across re-renders (won't reshuffle on parent state
   *  updates even if inline-array props create new references). When
   *  omitted, falls back to a hash of position + scale + subBlobs so
   *  visually identical inputs still produce identical geometry. */
  seed?: number
}

// A distant emission nebula in the deep field — colored particle cloud
// with clumpy internal structure built from a handful of sub-blobs. Each
// sub-blob has its own random color bias, so different parts of the
// cloud read pink, magenta, blue, etc. naturally.
//
// Composed of Gaussian-scattered particles per sub-blob, with brightness
// falling off radially from each sub-center. Final visual is fuzzy
// multi-colored haze with hot bright knots and dim outer wisps.

// Seeded RNG factory (mulberry32). Same seed → same stream of values,
// which means identical Nebula inputs produce byte-identical geometry
// across renders. This protects us from inline-array prop references
// changing on every parent re-render (the v1 bug).
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return function (): number {
    a = (a + 0x6D2B79F5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Cheap deterministic 32-bit hash from a string. Used to derive a seed
// from a Nebula's position + scale + subBlobs when no explicit seed is
// passed.
function strHash(s: string): number {
  let h = 2166136261 >>> 0
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0
  }
  return h >>> 0
}

// Box-Muller standard-normal (clamped to ±3σ), using a seeded uniform.
function rndN(rng: () => number): number {
  const u1 = Math.max(rng(), 1e-6)
  const u2 = rng()
  const g = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  return Math.max(-3, Math.min(3, g))
}

export function Nebula({
  position = [-90, 30, -130],
  scale = 22,
  particleCount = 4000,
  subBlobs = 7,
  innerColor = '#ff7090',
  midColor = '#b860c0',
  outerColor = '#6080d8',
  opacity = 0.55,
  materialRef,
  seed,
}: NebulaProps) {
  const texture = useMemo(() => discTexture(), [])

  // Primitive-only useMemo deps so inline-array `position` props don't
  // trigger regeneration on parent re-renders.
  const px = position[0], py = position[1], pz = position[2]

  // Effective seed: explicit `seed` wins; otherwise derive from the
  // visually-identifying inputs so two Nebulae with identical args
  // look identical (and a single Nebula stays stable across renders).
  const effSeed = seed !== undefined
    ? seed
    : strHash(`${px}|${py}|${pz}|${scale}|${subBlobs}|${innerColor}|${midColor}|${outerColor}`)

  const { positions, colors } = useMemo(() => {
    const rng = mulberry32(effSeed)
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    const inner = new THREE.Color(innerColor)
    const mid = new THREE.Color(midColor)
    const outer = new THREE.Color(outerColor)
    const tmp = new THREE.Color()

    // pre-compute sub-blob centers + per-blob characteristics
    const blobs = []
    for (let s = 0; s < subBlobs; s++) {
      const cx = rndN(rng) * scale * 0.32
      const cy = rndN(rng) * scale * 0.20
      const cz = rndN(rng) * scale * 0.32
      const subRadius = scale * (0.22 + rng() * 0.50)
      const colorPhase = rng()
      blobs.push({ cx, cy, cz, subRadius, colorPhase })
    }

    for (let i = 0; i < particleCount; i++) {
      const blobIdx = i % subBlobs
      const blob = blobs[blobIdx]

      const gx = rndN(rng) * blob.subRadius * 0.55
      const gy = rndN(rng) * blob.subRadius * 0.45
      const gz = rndN(rng) * blob.subRadius * 0.55

      positions[i * 3]     = px + blob.cx + gx
      positions[i * 3 + 1] = py + blob.cy + gy
      positions[i * 3 + 2] = pz + blob.cz + gz

      const localDist = Math.sqrt(gx * gx + gy * gy + gz * gz)
      const distFrac = Math.min(1, localDist / blob.subRadius)

      const colorT = Math.min(1, distFrac * 0.85 + blob.colorPhase * 0.5)
      if (colorT < 0.5) tmp.copy(inner).lerp(mid, colorT * 2)
      else              tmp.copy(mid).lerp(outer, (colorT - 0.5) * 2)

      const brightness = Math.pow(1 - distFrac, 1.8) * (0.45 + rng() * 0.55)

      colors[i * 3]     = tmp.r * brightness
      colors[i * 3 + 1] = tmp.g * brightness
      colors[i * 3 + 2] = tmp.b * brightness
    }
    return { positions, colors }
  }, [px, py, pz, scale, particleCount, subBlobs, innerColor, midColor, outerColor, effSeed])

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color"    args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
        size={5}
        sizeAttenuation={false}
        vertexColors
        map={texture}
        alphaMap={texture}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        transparent
        opacity={opacity}
      />
    </points>
  )
}
