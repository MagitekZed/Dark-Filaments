import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { discTexture } from './discTexture'

interface DustHazeProps {
  /** Multiplier on per-particle alpha. 1.0 = full haze, 0 = invisible. */
  density?: number
  /** Approx half-extent of the box the dust fills (xz half-size). */
  extent?: number
  /** Vertical thickness of the haze slab. */
  thickness?: number
  count?: number
}

// Interstellar dust haze for the Stellar Neighborhood base scene.
//
// A loose 3D cloud of small soft points filling the volume between field
// stars. Per-particle alpha is modulated by a low-frequency density field
// so the haze has visible patchy structure rather than uniform fog. The
// `density` prop scales every particle's alpha — Local Bubble can pass
// densityFactor < 1 to "carve" a thinner medium without removing the dust
// entirely.

export function DustHaze({
  density = 1.0,
  extent = 28,
  thickness = 6,
  count = 1800,
}: DustHazeProps) {
  const matRef = useRef<THREE.PointsMaterial>(null)
  const texture = useMemo(() => discTexture(), [])

  const { positions, colors } = useMemo(() => {
    const posArr = new Float32Array(count * 3)
    const colArr = new Float32Array(count * 3)
    const palette = [
      new THREE.Color('#3a2a30'),
      new THREE.Color('#4a3236'),
      new THREE.Color('#382838'),
      new THREE.Color('#503838'),
      new THREE.Color('#2a2438'),
    ]
    for (let i = 0; i < count; i++) {
      const x = (Math.random() * 2 - 1) * extent
      const z = (Math.random() * 2 - 1) * extent
      const y = (Math.random() * 2 - 1) * thickness
      posArr[i * 3]     = x
      posArr[i * 3 + 1] = y
      posArr[i * 3 + 2] = z

      // low-frequency density field — patchy dark lanes
      const d = (
        Math.sin(x * 0.08 + z * 0.05) * Math.cos(z * 0.07 - y * 0.10) +
        Math.sin(z * 0.12 - x * 0.04) * Math.cos(y * 0.18 + x * 0.06)
      ) / 2.0
      const brightness = Math.pow(Math.random(), 1.6) * (0.5 + d * 0.35)

      const c = palette[Math.floor(Math.random() * palette.length)]
      colArr[i * 3]     = c.r * Math.max(0, brightness)
      colArr[i * 3 + 1] = c.g * Math.max(0, brightness)
      colArr[i * 3 + 2] = c.b * Math.max(0, brightness)
    }
    return { positions: posArr, colors: colArr }
  }, [extent, thickness, count])

  // very slow drift — barely visible, just enough to feel alive
  useFrame((_, delta) => {
    if (matRef.current) {
      // density modulates the overall opacity; do not push above 1
      matRef.current.opacity = Math.max(0, Math.min(1, 0.42 * density))
    }
    void delta
  })

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color"    args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={matRef}
        map={texture}
        size={1.4}
        sizeAttenuation
        vertexColors
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        transparent
        opacity={0.42 * density}
        alphaTest={0.01}
      />
    </points>
  )
}
