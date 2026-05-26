import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { sparkTexture } from './discTexture'

// Dwarf Spheroidal Cloud — the T3 tier body. The player is no longer a star;
// the structure itself is the player (the "embedding" the tier-up line names:
// "We are inside something we cannot see. The stars we can count are the small
// part. The rest holds.").
//
// Real astronomy: dwarf spheroidals (Draco, Sculptor, Ursa Minor, …) are small,
// GAS-POOR, dark-matter-dominated satellite galaxies — a diffuse, roughly
// ellipsoidal swarm of old, metal-poor Population II stars. They are
// PRESSURE-SUPPORTED, not rotation-supported: the stars are held by velocity
// dispersion in a dark matter halo, not spinning in a disc. So this cloud does
// NOT rotate like a galaxy — it sits, held, breathing almost imperceptibly. No
// natal nebula (that would be young gas; this population is ancient).
//
// Palette is warm and dim — old red giants, amber turnoff stars, faint K/M
// dwarfs. Most members are dim pinpricks; a handful of evolved red giants bloom
// into beacons. No blue young stars (the RR Lyrae horizontal-branch pulsators
// are added separately, on top of this base population).
//
// Density is engine-driven: `densityScale` comes from useStackableDensity(3)
// (the aggregate of the tier's stackables, dominated by Population II). At zero
// levels the cloud sits at its base size; as Population II stacks, more of the
// old population resolves into view.

interface DwarfSpheroidalCloudProps {
  /** Aggregate stackable density scalar from useStackableDensity(3),
   *  in [1.0, ~2.0]. Maps to the fraction of the old population revealed. */
  densityScale?: number
  /** Additive glow boost in [0, ~0.5] from useStackableDensity — a faint
   *  brightening of the whole cloud as it densifies. */
  glowBoost?: number
  /** Cloud center in world space (clicks pull toward this — the DM well). */
  center?: [number, number, number]
  /** Half-extent of the spheroid's long axis. */
  radius?: number
}

const MAX_STARS = 5200
// Base visible count at zero T3 stackables — the dwarf spheroidal already
// exists as the tier body the moment the player arrives.
const MIN_VISIBLE = 1500

// Hash → [0, 1). Deterministic per index so the cloud is identical across
// renders/saves (the structure is seeded, particles within it are stable).
function hash01(x: number): number {
  const y = Math.sin(x) * 43758.5453
  return y - Math.floor(y)
}

// Old, metal-poor palette: warm reds → amber → faint pale. Population II has no
// hot blue young stars; the warmest members are evolved red giants.
function oldStarColor(t: number, brightness: number): [number, number, number] {
  if (t < 0.30) {
    // deep red giant / cool M
    return [brightness * 1.0, brightness * 0.40, brightness * 0.22]
  } else if (t < 0.58) {
    // red-orange K giant
    return [brightness * 1.0, brightness * 0.55, brightness * 0.30]
  } else if (t < 0.82) {
    // amber / old-yellow turnoff
    return [brightness * 1.0, brightness * 0.78, brightness * 0.50]
  } else {
    // faint pale (metal-poor main-sequence turnoff) — slightly cool-white,
    // kept dim so the bulk still reads as an old warm swarm
    return [brightness * 0.86, brightness * 0.88, brightness * 0.96]
  }
}

export function DwarfSpheroidalCloud({
  densityScale = 1.0,
  glowBoost = 0,
  center = [0, 0, 0],
  radius = 16,
}: DwarfSpheroidalCloudProps) {
  const texture = useMemo(() => sparkTexture(), [])
  const groupRef = useRef<THREE.Group>(null)
  const breatheRef = useRef(0)

  const cx = center[0], cy = center[1], cz = center[2]

  // Full deterministic star table (positions + colors), baked once. Revealing
  // more stars later just draws more of this stable table — the early stars
  // never move when the population grows.
  const table = useMemo(() => {
    const pos = new Float32Array(MAX_STARS * 3)
    const col = new Float32Array(MAX_STARS * 3)
    for (let i = 0; i < MAX_STARS; i++) {
      // Plummer-like radial sampling: concentrated core, diffuse outskirts.
      // pow < 1 pulls samples outward a touch so the halo reads diffuse.
      const r = radius * Math.pow(hash01(i * 7.13 + 1.7), 0.62)
      const phi = hash01(i * 3.71 + 5.2) * Math.PI * 2
      const cosTheta = hash01(i * 5.37 + 9.4) * 2 - 1
      const sinTheta = Math.sqrt(1 - cosTheta * cosTheta)
      // Slightly squashed (ellipsoidal) — dSphs are not perfect spheres.
      pos[i * 3 + 0] = cx + r * sinTheta * Math.cos(phi)
      pos[i * 3 + 1] = cy + r * cosTheta * 0.72
      pos[i * 3 + 2] = cz + r * sinTheta * Math.sin(phi) * 0.90

      // Temperature toward the warm/old end. A few pale outliers.
      const t = hash01(i * 2.91 + 0.3)
      // Brightness: most members faint pinpricks, a sparse few bloom into
      // red-giant beacons (pow^5 → mostly ~0, occasional big value).
      const baseline = 0.18 + hash01(i * 1.77 + 2.1) * 0.30   // 0.18–0.48
      const beacon = Math.pow(hash01(i * 9.51 + 4.4), 5) * 1.9 // ~0 mostly
      // Inner stars a touch brighter (denser core glows).
      const coreBoost = 1.0 + (1.0 - r / radius) * 0.35
      const brightness = (baseline + beacon) * coreBoost
      const c = oldStarColor(t, brightness)
      col[i * 3 + 0] = c[0]
      col[i * 3 + 1] = c[1]
      col[i * 3 + 2] = c[2]
    }
    return { pos, col }
  }, [cx, cy, cz, radius])

  // How many of the table's stars are currently visible. densityScale ∈ [1,2]
  // → reveal fraction ∈ [0,1]. Quantized so we re-slice only on real changes,
  // not every micro-fluctuation.
  const visibleCount = useMemo(() => {
    const frac = Math.min(1, Math.max(0, densityScale - 1))
    const raw = MIN_VISIBLE + Math.round(frac * (MAX_STARS - MIN_VISIBLE))
    return Math.min(MAX_STARS, raw)
  }, [densityScale])

  // Sliced buffers for the visible subset (stable referentially per count).
  const { positions, colors } = useMemo(() => ({
    positions: table.pos.subarray(0, visibleCount * 3),
    colors: table.col.subarray(0, visibleCount * 3),
  }), [table, visibleCount])

  // Pressure-supported equilibrium: a near-imperceptible breathing (the swarm
  // settling in its dark matter well) and an extremely slow tumble — NOT disc
  // rotation. The cloud reads as "held," alive but not driven.
  useFrame((_, delta) => {
    breatheRef.current += delta
    if (groupRef.current) {
      const s = 1 + Math.sin(breatheRef.current * 0.18) * 0.012
      groupRef.current.scale.set(s, s, s)
      groupRef.current.rotation.y += delta * 0.004
    }
  })

  const opacity = Math.min(1.0, 0.82 + glowBoost * 0.4)

  return (
    <group ref={groupRef}>
      <points key={visibleCount}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.7}
          sizeAttenuation
          map={texture}
          vertexColors
          transparent
          opacity={opacity}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          alphaTest={0.01}
          toneMapped={false}
        />
      </points>
    </group>
  )
}
