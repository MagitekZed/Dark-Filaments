import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { sparkTexture } from './discTexture'

interface JetsProps {
  radius?: number
  length?: number
}

const PER_JET = 1400
const TOTAL = PER_JET * 2

// Bipolar relativistic jets — animated particle system.
//
// Each particle has a parametric position `t` along the jet (0 = base near
// BH, 1 = tip). Per frame: advance `t` by its individual speed; when it
// passes 1, respawn at 0 with fresh random properties. Cross-section
// (cone radius, perpendicular angle) is set at spawn and held constant
// during the particle's life.
//
// Total particle count is constant — what changes per frame is each
// particle's position. Slight speed variation between particles keeps the
// base denser than the tip (slow ones linger, fast ones reach the tip
// first) without explicit density biasing.
//
// Brightness envelope: fade in over t∈[0,0.1], fade out over t∈[0.85,1].
export function BlackHoleJets({ radius = 0.22, length = 3.3 }: JetsProps) {
  const geomRef = useRef<THREE.BufferGeometry>(null)
  const texture = useMemo(() => sparkTexture(), [])

  // Persistent per-particle state + initial position/color buffers.
  // Initialized once; mutated every frame.
  const { state, positions, colors } = useMemo(() => {
    const positions = new Float32Array(TOTAL * 3)
    const colors = new Float32Array(TOTAL * 3)
    const state = {
      t:          new Float32Array(TOTAL),
      tSpeed:     new Float32Array(TOTAL),
      crossAngle: new Float32Array(TOTAL),
      crossFrac:  new Float32Array(TOTAL),
      jetSign:    new Int8Array(TOTAL),
    }
    const color = new THREE.Color()
    const innerColor = new THREE.Color('#bcdcff')
    const outerColor = new THREE.Color('#c890ff')

    const initParticle = (i: number) => {
      state.t[i]          = Math.random() // uniform initial spread → instant steady state on first frame
      state.tSpeed[i]     = 0.08 + Math.random() * 0.12 // [0.08..0.20] per second
      state.crossAngle[i] = Math.random() * Math.PI * 2
      const u1 = Math.max(Math.random(), 1e-6)
      const u2 = Math.random()
      const g  = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
      state.crossFrac[i]  = Math.min(Math.abs(g) * 0.45, 1.0)
      state.jetSign[i]    = i < PER_JET ? 1 : -1
    }

    for (let i = 0; i < TOTAL; i++) {
      initParticle(i)
      const t      = state.t[i]
      const z      = state.jetSign[i] * (radius + t * length)
      const coneR  = radius * 0.10 + t * radius * 0.65
      const offR   = state.crossFrac[i] * coneR
      const idx    = i * 3
      positions[idx]     = Math.cos(state.crossAngle[i]) * offR
      positions[idx + 1] = Math.sin(state.crossAngle[i]) * offR
      positions[idx + 2] = z

      color.copy(innerColor).lerp(outerColor, t)
      const fadeIn  = Math.min(1, t / 0.10)
      const fadeOut = Math.min(1, (1 - t) / 0.15)
      const env     = fadeIn * fadeOut * (1.0 - t * 0.55)
      colors[idx]     = color.r * env
      colors[idx + 1] = color.g * env
      colors[idx + 2] = color.b * env
    }

    return { state, positions, colors }
  }, [radius, length])

  // Stable color refs for the per-frame loop
  const innerColor = useMemo(() => new THREE.Color('#bcdcff'), [])
  const outerColor = useMemo(() => new THREE.Color('#c890ff'), [])

  useFrame((_, delta) => {
    // clamp delta to avoid huge jumps on tab refocus
    const dt = Math.min(delta, 0.1)
    const color = new THREE.Color()

    for (let i = 0; i < TOTAL; i++) {
      let t = state.t[i] + state.tSpeed[i] * dt
      if (t >= 1.0) {
        // respawn at base with fresh randoms
        t = 0.0
        state.tSpeed[i]     = 0.08 + Math.random() * 0.12
        state.crossAngle[i] = Math.random() * Math.PI * 2
        const u1 = Math.max(Math.random(), 1e-6)
        const u2 = Math.random()
        const g  = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
        state.crossFrac[i]  = Math.min(Math.abs(g) * 0.45, 1.0)
      }
      state.t[i] = t

      const z     = state.jetSign[i] * (radius + t * length)
      const coneR = radius * 0.10 + t * radius * 0.65
      const offR  = state.crossFrac[i] * coneR
      const idx   = i * 3
      positions[idx]     = Math.cos(state.crossAngle[i]) * offR
      positions[idx + 1] = Math.sin(state.crossAngle[i]) * offR
      positions[idx + 2] = z

      color.copy(innerColor).lerp(outerColor, t)
      const fadeIn  = Math.min(1, t / 0.10)
      const fadeOut = Math.min(1, (1 - t) / 0.15)
      const env     = fadeIn * fadeOut * (1.0 - t * 0.55)
      colors[idx]     = color.r * env
      colors[idx + 1] = color.g * env
      colors[idx + 2] = color.b * env
    }

    if (geomRef.current) {
      geomRef.current.attributes.position.needsUpdate = true
      geomRef.current.attributes.color.needsUpdate = true
    }
  })

  return (
    <group rotation={[Math.PI / 2.3, 0.18, 0]}>
      <points>
        <bufferGeometry ref={geomRef}>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color"    args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.022}
          sizeAttenuation
          vertexColors
          map={texture}
          alphaMap={texture}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          transparent
          opacity={0.9}
        />
      </points>
    </group>
  )
}
