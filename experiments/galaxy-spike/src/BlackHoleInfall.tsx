import { useMemo } from 'react'
import * as THREE from 'three'
import { sparkTexture } from './discTexture'

interface InfallProps {
  radius?: number
}

// Infalling-matter streams — a handful of spiral arcs of particles curving
// inward from beyond the accretion disk to merge with it. Bright warm
// colors (gas heating up as it falls in), brighter near the disk edge.
export function BlackHoleInfall({ radius = 0.22 }: InfallProps) {
  const texture = useMemo(() => sparkTexture(), [])

  const { positions, colors } = useMemo(() => {
    const NUM_STREAMS = 6
    const PER_STREAM = 240
    const total = NUM_STREAMS * PER_STREAM
    const positions = new Float32Array(total * 3)
    const colors = new Float32Array(total * 3)
    const color = new THREE.Color()
    // outer (cool, dimmer) → inner (hot, bright)
    const outer = new THREE.Color('#6b3220')
    const inner = new THREE.Color('#ffcc70')

    for (let s = 0; s < NUM_STREAMS; s++) {
      const startR = radius * (2.6 + Math.random() * 2.2) // 2.6..4.8 BH radii
      const endR   = radius * 1.65                         // disk inner edge
      const startAngle = Math.random() * Math.PI * 2
      // some streams co-rotate with disk, some counter — most co
      const direction = Math.random() < 0.85 ? 1 : -1
      const winds = (0.7 + Math.random() * 1.6) * direction
      // some streams start above plane, some below
      const startHeight = (Math.random() - 0.5) * radius * 1.6
      // brightness scale — some streams more luminous than others
      const streamBrightness = 0.6 + Math.random() * 0.6

      for (let i = 0; i < PER_STREAM; i++) {
        const t = i / (PER_STREAM - 1)
        // ease-out: spiral slows + flattens as it approaches disk
        const e = 1 - Math.pow(1 - t, 1.8)
        const r = startR * (1 - e) + endR * e
        const angle = startAngle + winds * 2 * Math.PI * t
        const heightFrac = Math.pow(1 - t, 1.3) // converges to plane
        const y = startHeight * heightFrac

        // perpendicular jitter shrinks as stream tightens
        const jitter = radius * 0.05 * (1 - t * 0.8)
        const jx = (Math.random() - 0.5) * jitter
        const jy = (Math.random() - 0.5) * jitter * 0.4
        const jz = (Math.random() - 0.5) * jitter

        const idx = (s * PER_STREAM + i) * 3
        positions[idx]     = Math.cos(angle) * r + jx
        positions[idx + 1] = Math.sin(angle) * r + jz
        positions[idx + 2] = y + jy

        color.copy(outer).lerp(inner, t)
        const b = streamBrightness * (0.4 + 0.6 * t) // brighter near disk
        colors[idx]     = color.r * b
        colors[idx + 1] = color.g * b
        colors[idx + 2] = color.b * b
      }
    }
    return { positions, colors }
  }, [radius])

  return (
    // same outer rotation as the accretion disk → streams converge into
    // the disk plane, not the galaxy plane
    <group rotation={[Math.PI / 2.3, 0.18, 0]}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color"    args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.018}
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
