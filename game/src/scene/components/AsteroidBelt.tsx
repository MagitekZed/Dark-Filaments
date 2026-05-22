import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { sparkTexture } from './discTexture'

interface AsteroidBeltProps {
  /** Inner radius of the belt (world units). */
  innerRadius?: number
  /** Outer radius of the belt. */
  outerRadius?: number
  /** Number of asteroid particles. */
  count?: number
  /** Vertical thickness of the belt. Real asteroid belt is mostly flat. */
  thickness?: number
  /** Orbital period at the middle of the belt, in seconds. */
  midOrbitPeriod?: number
  /** Color palette — defaults to warm earth tones. Override for Kuiper-style icy. */
  colors?: string[]
  /** Particle size override. */
  particleSize?: number
  /** Live-tweenable opacity on the points material. */
  opacity?: number
}

// Asteroid belt — a thin ring of small rocky particles between Mars and
// Jupiter. Each asteroid has its own radius, angular position, and Keplerian
// angular velocity (ω ∝ r^-1.5), so inner asteroids lap outer ones over
// the course of a session.
//
// Uses normal alpha blending (not additive) so the rocks read as solid
// colored dots rather than glowing motes — distinct from every other
// particle population in the scene which uses additive blending.

const ASTEROID_COLORS = [
  '#a89078',
  '#b89c80',
  '#8a7460',
  '#9c8470',
  '#c0a888',
  '#7e6852',
  '#a88c70',
  '#b09078',
]

export function AsteroidBelt({
  innerRadius = 7.7,
  outerRadius = 8.7,
  count = 600,
  thickness = 0.18,
  midOrbitPeriod = 195,
  colors: colorOverride,
  particleSize = 0.048,
  opacity = 1.0,
}: AsteroidBeltProps) {
  const geomRef = useRef<THREE.BufferGeometry>(null)
  const texture = useMemo(() => sparkTexture(), [])

  const { state, positions, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const state = {
      r:     new Float32Array(count),
      angle: new Float32Array(count),
      omega: new Float32Array(count),
      y:     new Float32Array(count),
    }

    const colorList = colorOverride ?? ASTEROID_COLORS
    const palette = colorList.map(c => new THREE.Color(c))
    const tmpC = new THREE.Color()
    const midR = (innerRadius + outerRadius) * 0.5
    const omegaMid = (Math.PI * 2) / midOrbitPeriod

    for (let i = 0; i < count; i++) {
      // bias slightly toward the middle of the belt — real belts are densest there
      const u = Math.random() * 2 - 1
      const t = Math.sign(u) * Math.pow(Math.abs(u), 1.6) * 0.5 + 0.5
      const r = innerRadius + t * (outerRadius - innerRadius)

      const angle = Math.random() * Math.PI * 2
      // Keplerian — inner ones whip around faster than outer ones
      const omega = omegaMid * Math.pow(midR / r, 1.5)
      // thin disc, Gaussian-ish vertical distribution
      const y = (Math.random() - 0.5) * thickness * Math.pow(Math.random(), 0.5)

      state.r[i]     = r
      state.angle[i] = angle
      state.omega[i] = omega
      state.y[i]     = y

      positions[i * 3]     = Math.cos(angle) * r
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = Math.sin(angle) * r

      tmpC.copy(palette[Math.floor(Math.random() * palette.length)])
      const b = 0.75 + Math.random() * 0.35 // per-asteroid brightness variation (brighter floor)
      colors[i * 3]     = tmpC.r * b
      colors[i * 3 + 1] = tmpC.g * b
      colors[i * 3 + 2] = tmpC.b * b
    }

    return { state, positions, colors }
  }, [innerRadius, outerRadius, count, thickness, midOrbitPeriod, colorOverride])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1)
    for (let i = 0; i < count; i++) {
      let a = state.angle[i] + state.omega[i] * dt
      if (a > Math.PI * 2) a -= Math.PI * 2
      state.angle[i] = a

      const r  = state.r[i]
      const i3 = i * 3
      positions[i3]     = Math.cos(a) * r
      positions[i3 + 1] = state.y[i]
      positions[i3 + 2] = Math.sin(a) * r
    }
    if (geomRef.current) {
      geomRef.current.attributes.position.needsUpdate = true
    }
  })

  return (
    <points>
      <bufferGeometry ref={geomRef}>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color"    args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={particleSize}
        sizeAttenuation
        vertexColors
        map={texture}
        alphaMap={texture}
        depthWrite={false}
        transparent
        opacity={opacity}
      />
    </points>
  )
}
