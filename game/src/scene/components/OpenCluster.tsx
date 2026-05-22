import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { sparkTexture } from './discTexture'
import { Nebula } from './Nebula'

interface OpenClusterProps {
  /** Cluster center in world space. */
  center?: [number, number, number]
  /** Approximate spatial radius (half-extent) of the cluster cloud. */
  radius?: number
  /** Number of cluster member stars to render. */
  starCount?: number
  /** Seed for deterministic star positions/colors. */
  seed?: number
}

// Open Cluster — a loosely bound group of stars formed together from
// the same giant molecular cloud. Real examples: the Pleiades (M45),
// Hyades, M44 (Beehive), M11 (Wild Duck). Typically a few dozen to
// a few thousand stars, young (~10–100 Myr), kinematically coherent,
// often surrounded by residual reflection nebulosity from the parent
// cloud.
//
// In the T2 design slate this is the T2→T3 gate one-shot — the
// "we made it to galactic-arm-scale" moment. Visual goal: a coherent
// chunk of young blue-white stars appearing mid-field, with subtle
// natal-gas nebulosity backing the cluster center.
//
// Implementation: bright billboarded sprite-style points (Points rig
// with sparkTexture), per-star temperature variation toward the young
// blue-white end of the palette, plus a small Nebula instance for the
// gas. Slow coherent rotation suggests shared cluster kinematics.

// Hash → [0, 1)
function hash01(x: number): number {
  const y = Math.sin(x) * 43758.5453
  return y - Math.floor(y)
}

// Young-cluster palette — biased toward blue-white (hot O/B/A members)
// with a smattering of yellow-orange evolved members. Temperatures
// roughly map: 0 = red dwarf, 1 = O-type.
const CLUSTER_TEMP_BIAS = [0.55, 0.60, 0.65, 0.72, 0.78, 0.85, 0.85, 0.90, 0.90, 0.95]

// Color lookup for a temperature value — pale-blue-white spectrum.
function colorFromTemp(t: number, brightness: number): [number, number, number] {
  if (t < 0.45) {
    // K-type orange (rare in young clusters)
    return [brightness * 1.0, brightness * 0.78, brightness * 0.55]
  } else if (t < 0.60) {
    // G-type sun-yellow
    return [brightness * 1.0, brightness * 0.94, brightness * 0.75]
  } else if (t < 0.75) {
    // F-type white
    return [brightness * 1.0, brightness * 0.98, brightness * 0.92]
  } else if (t < 0.88) {
    // A-type blue-white
    return [brightness * 0.92, brightness * 0.96, brightness * 1.05]
  } else {
    // B/O-type hot blue
    return [brightness * 0.78, brightness * 0.88, brightness * 1.15]
  }
}

export function OpenCluster({
  center = [3, -3, -15],
  radius = 4.5,
  starCount = 45,
  seed = 1,
}: OpenClusterProps) {
  const texture = useMemo(() => sparkTexture(), [])
  const groupRef = useRef<THREE.Group>(null)

  // Primitive useMemo deps so an inline-array `center` prop default
  // doesn't churn the buffers on each parent re-render. (The math is
  // already seeded via `hash01`, so even an invalidated re-compute
  // would produce identical buffers — but the wasted work is real.)
  const cx0 = center[0], cy0 = center[1], cz0 = center[2]

  // Generate deterministic cluster star positions, target colors, and
  // per-particle fade durations.
  const { positions, targetColors, fadeDurations } = useMemo(() => {
    const pos = new Float32Array(starCount * 3)
    const tcol = new Float32Array(starCount * 3)
    const dur = new Float32Array(starCount)

    for (let i = 0; i < starCount; i++) {
      // Position: spherical distribution biased toward center via cube
      // root sampling (uniform volume → roughly Plummer-like density).
      const r = radius * Math.pow(hash01(seed * 13 + i * 7.1), 0.45)
      const phi = hash01(seed * 17 + i * 3.7) * Math.PI * 2
      const cosTheta = hash01(seed * 19 + i * 5.3) * 2 - 1
      const sinTheta = Math.sqrt(1 - cosTheta * cosTheta)

      pos[i * 3 + 0] = cx0 + r * sinTheta * Math.cos(phi)
      pos[i * 3 + 1] = cy0 + r * sinTheta * Math.sin(phi) * 0.7  // slight vertical squash
      pos[i * 3 + 2] = cz0 + r * cosTheta

      // Temperature pulled from the young-cluster biased palette.
      const tIdx = Math.floor(hash01(seed * 23 + i * 2.9) * CLUSTER_TEMP_BIAS.length)
      const t = CLUSTER_TEMP_BIAS[Math.min(tIdx, CLUSTER_TEMP_BIAS.length - 1)]
      // Brightness strongly biased: most members dim pinpricks, only
      // a few notable beacons.
      const baseline = 0.30 + hash01(seed * 29 + i * 1.7) * 0.40   // 0.30 – 0.70
      const beacon   = Math.pow(hash01(seed * 41 + i * 9.5), 4) * 2.20  // ~0 mostly, up to ~2.2
      const brightness = baseline + beacon
      const c = colorFromTemp(t, brightness)
      tcol[i * 3 + 0] = c[0]
      tcol[i * 3 + 1] = c[1]
      tcol[i * 3 + 2] = c[2]

      // Per-particle fade-in duration in seconds (3 to 15s) — random
      // so members "wake up" at different times during the transition.
      dur[i] = 3 + hash01(seed * 47 + i * 1.3) * 12
    }
    return { positions: pos, targetColors: tcol, fadeDurations: dur }
  }, [cx0, cy0, cz0, radius, starCount, seed])

  // Live (mutated each frame) color buffer for fade-in animation.
  const colors = useMemo(() => new Float32Array(starCount * 3), [starCount])

  // Per-nebula fade durations — randomised so they brighten on
  // different schedules. Stored as refs so we don't recompute.
  const nebulaFades = useMemo(() => ({
    main:    3 + hash01(seed * 53) * 12,    // 3–15s
    pocket1: 3 + hash01(seed * 59) * 12,
    pocket2: 3 + hash01(seed * 61) * 12,
  }), [seed])

  // Nebula material refs so we can drive opacity each frame.
  const mainNebMat    = useRef<THREE.PointsMaterial>(null)
  const pocket1NebMat = useRef<THREE.PointsMaterial>(null)
  const pocket2NebMat = useRef<THREE.PointsMaterial>(null)

  // Ref to the cluster Points so we can write into its color buffer.
  const clusterPointsRef = useRef<THREE.Points>(null)

  // Elapsed time since mount (when OpenCluster was first enabled).
  const elapsed = useRef(0)

  // Slow coherent rotation + fade-in animation.
  useFrame((_, delta) => {
    elapsed.current += delta

    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.015
    }

    // Per-particle fade-in for cluster stars.
    if (clusterPointsRef.current) {
      const geom = clusterPointsRef.current.geometry as THREE.BufferGeometry
      const colAttr = geom.attributes.color as THREE.BufferAttribute
      const colArr  = colAttr.array as Float32Array
      for (let i = 0; i < starCount; i++) {
        const tt = Math.min(1, elapsed.current / fadeDurations[i])
        // smoothstep for an ease-in feel
        const fade = tt * tt * (3 - 2 * tt)
        colArr[i * 3 + 0] = targetColors[i * 3 + 0] * fade
        colArr[i * 3 + 1] = targetColors[i * 3 + 1] * fade
        colArr[i * 3 + 2] = targetColors[i * 3 + 2] * fade
      }
      colAttr.needsUpdate = true
    }

    // Nebula fade-ins, each on its own random duration.
    const fadeNeb = (mat: THREE.PointsMaterial | null, dur: number, target: number) => {
      if (!mat) return
      const tt = Math.min(1, elapsed.current / dur)
      const fade = tt * tt * (3 - 2 * tt)
      mat.opacity = target * fade
    }
    fadeNeb(mainNebMat.current,    nebulaFades.main,    0.55)
    fadeNeb(pocket1NebMat.current, nebulaFades.pocket1, 0.55)
    fadeNeb(pocket2NebMat.current, nebulaFades.pocket2, 0.55)
  })

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Main natal nebulosity — what's left of the molecular cloud
          that birthed the cluster. Larger + clumpier than v1 to read
          as a real H II region rather than just background haze. */}
      <Nebula
        position={center}
        scale={radius * 1.9}
        particleCount={2000}
        subBlobs={9}
        innerColor="#a890d0"
        midColor="#5070b8"
        outerColor="#283878"
        opacity={0}
        materialRef={mainNebMat}
      />

      {/* Loose gas pocket #1 — offset to one side of the cluster.
          Suggests gas not yet collapsed into stars. */}
      <Nebula
        position={[center[0] + 2.6, center[1] + 1.0, center[2] - 1.5]}
        scale={radius * 0.9}
        particleCount={700}
        subBlobs={4}
        innerColor="#c0a8e0"
        midColor="#7088c0"
        outerColor="#304878"
        opacity={0}
        materialRef={pocket1NebMat}
      />

      {/* Loose gas pocket #2 — offset to the other side, smaller
          and dimmer. A second molecular cloud fragment still pre-
          stellar in its evolution. */}
      <Nebula
        position={[center[0] - 2.4, center[1] - 0.8, center[2] + 1.2]}
        scale={radius * 0.7}
        particleCount={500}
        subBlobs={4}
        innerColor="#9080c0"
        midColor="#5060a0"
        outerColor="#283060"
        opacity={0}
        materialRef={pocket2NebMat}
      />

      {/* Cluster member stars — bright billboarded sprites with
          sparkTexture for tight cores + soft bloom feed. Uniform
          point size is small so most members read as pinpricks; the
          brightness variation (vertex colors) makes a few bloom into
          notable beacons. Color buffer is mutated each frame to
          drive per-particle fade-in. */}
      <points ref={clusterPointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
            count={starCount}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[colors, 3]}
            count={starCount}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.9}
          sizeAttenuation
          map={texture}
          vertexColors
          transparent
          opacity={0.95}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          alphaTest={0.01}
          toneMapped={false}
        />
      </points>
    </group>
  )
}
