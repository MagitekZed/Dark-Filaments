import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { sparkTexture } from './discTexture'

interface DiscProps {
  radius?: number
}

// Particle-based accretion disc — replaces the previous solid-torus look.
//
// Each particle has:
//   - fixed orbital radius r (no inward migration in this spike)
//   - angle θ around the disc axis, advancing per frame
//   - angular velocity ω ∝ r^-1.5  (Keplerian)
//   - fixed vertical offset y (Gaussian scale height that puffs near inner)
//   - base color picked from a hot-inner → cool-outer ramp
//
// Per frame: advance θ, write new position; apply Doppler-boost asymmetry
// to the color (one half of the disc brighter than the other).
//
// Bloom does the rest of the work — the hot inner edge becomes the glowing
// ring of light that defines a real accretion disc visually.

const PARTICLE_COUNT = 6000
const R_INNER_MULT   = 1.4   // disc inner edge in BH radii (just outside photon ring)
const R_OUTER_MULT   = 4.2
const KEPLER_BASE    = 0.85  // angular velocity scale (rad/s at inner edge)
const DOPPLER_STRENGTH = 0.55
const DOPPLER_PHASE    = 0   // angle (in disc local frame) where Doppler boost peaks

export function BlackHoleAccretionDisc({ radius = 0.22 }: DiscProps) {
  const geomRef = useRef<THREE.BufferGeometry>(null)
  const texture = useMemo(() => sparkTexture(), [])

  const innerR = radius * R_INNER_MULT
  const outerR = radius * R_OUTER_MULT

  const { state, positions, colors } = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3)
    const colors    = new Float32Array(PARTICLE_COUNT * 3)
    const state = {
      r:          new Float32Array(PARTICLE_COUNT),
      angle:      new Float32Array(PARTICLE_COUNT),
      omega:      new Float32Array(PARTICLE_COUNT),
      perpOffset: new Float32Array(PARTICLE_COUNT), // signed distance from disc midplane
      baseColor:  new Float32Array(PARTICLE_COUNT * 3),
    }

    const color  = new THREE.Color()
    const cHot   = new THREE.Color('#fff5cc') // hot white near ISCO
    const cMid   = new THREE.Color('#ffa850') // warm orange mid-disc
    const cCool  = new THREE.Color('#993820') // dim red outer rim

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // bias toward inner edge — more particles where mass is hot and dense
      const u = Math.random()
      const t = Math.pow(u, 1.6)
      const r = innerR + t * (outerR - innerR)
      const angle = Math.random() * Math.PI * 2

      // Keplerian angular velocity (radians/sec): ω = ω0 * (r/r_in)^-1.5
      const omega = KEPLER_BASE * Math.pow(r / innerR, -1.5)

      // vertical Gaussian — puffy at inner, thin at outer
      const fr = (r - innerR) / (outerR - innerR) // 0 at inner, 1 at outer
      const hScale = (0.20 - 0.15 * fr) * r
      const u1 = Math.max(Math.random(), 1e-6)
      const u2 = Math.random()
      const g  = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
      const perp = g * hScale * 0.5

      state.r[i]          = r
      state.angle[i]      = angle
      state.omega[i]      = omega
      state.perpOffset[i] = perp

      // color ramp: inner half = hot→mid, outer half = mid→cool
      if (fr < 0.5) color.copy(cHot).lerp(cMid, fr * 2)
      else          color.copy(cMid).lerp(cCool, (fr - 0.5) * 2)

      // boost brightness near ISCO (where temperature is highest)
      const brightnessRamp = 1 + 1.6 * Math.pow(1 - fr, 2.2)
      const i3 = i * 3
      state.baseColor[i3]     = color.r * brightnessRamp
      state.baseColor[i3 + 1] = color.g * brightnessRamp
      state.baseColor[i3 + 2] = color.b * brightnessRamp

      // initial position — disc lies in local XY plane (normal = +Z) so it
      // sits perpendicular to the jet axis (which runs along ±Z)
      positions[i3]     = Math.cos(angle) * r
      positions[i3 + 1] = Math.sin(angle) * r
      positions[i3 + 2] = perp

      // initial color with Doppler boost
      const dop = 1 + DOPPLER_STRENGTH * Math.cos(angle - DOPPLER_PHASE)
      colors[i3]     = state.baseColor[i3]     * dop
      colors[i3 + 1] = state.baseColor[i3 + 1] * dop
      colors[i3 + 2] = state.baseColor[i3 + 2] * dop
    }

    return { state, positions, colors }
  }, [radius, innerR, outerR])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1)
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      let a = state.angle[i] + state.omega[i] * dt
      if (a > Math.PI * 2) a -= Math.PI * 2
      state.angle[i] = a

      const r  = state.r[i]
      const i3 = i * 3
      positions[i3]     = Math.cos(a) * r
      positions[i3 + 1] = Math.sin(a) * r
      positions[i3 + 2] = state.perpOffset[i]

      const dop = 1 + DOPPLER_STRENGTH * Math.cos(a - DOPPLER_PHASE)
      colors[i3]     = state.baseColor[i3]     * dop
      colors[i3 + 1] = state.baseColor[i3 + 1] * dop
      colors[i3 + 2] = state.baseColor[i3 + 2] * dop
    }

    if (geomRef.current) {
      geomRef.current.attributes.position.needsUpdate = true
      geomRef.current.attributes.color.needsUpdate    = true
    }
  })

  return (
    // same outer rotation as the original disc — perpendicular to jet axis
    <group rotation={[Math.PI / 2.3, 0.18, 0]}>
      <points>
        <bufferGeometry ref={geomRef}>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color"    args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.030}
          sizeAttenuation
          vertexColors
          map={texture}
          alphaMap={texture}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          transparent
          opacity={0.95}
        />
      </points>
    </group>
  )
}
