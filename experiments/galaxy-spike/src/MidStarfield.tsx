import { useMemo } from 'react'
import * as THREE from 'three'
import { sparkTexture } from './discTexture'

interface MidStarfieldProps {
  count?: number
  /** Inner radius of the spherical shell where stars sit. */
  innerRadius?: number
  /** Outer radius. */
  outerRadius?: number
}

// Middle-distance star sprinkle — fills the volume between the named
// field stars (at ~30 units) and the DeepStarfield (at 100-240). Without
// this layer there's a visible "step" between the few bright field
// stars and the far background pinpricks; the volume in between reads
// as empty when it shouldn't.
//
// Points are dim, with mild spectral-class tint variation, sized small
// with sizeAttenuation so they fade naturally with distance. ~80%
// neutral-cool, with a smattering of warmer reds and pinks (older
// population II + foreground reddening through the dust).

const PALETTE = [
  '#c8d0e0', '#c8d0e0', '#c8d0e0', '#c8d0e0',
  '#d8d8ec', '#d8d8ec',
  '#b8c4d8', '#b8c4d8',
  '#e0c4a8', '#dcb898',   // warm
  '#c8a890',
  '#c4b4d4',              // cool violet
]

export function MidStarfield({
  count = 320,
  innerRadius = 55,
  outerRadius = 95,
}: MidStarfieldProps) {
  const texture = useMemo(() => sparkTexture(), [])

  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const c = new THREE.Color()

    for (let i = 0; i < count; i++) {
      // uniform direction on the sphere, with a vertical squash so the
      // layer biases toward the galactic plane
      let x = 0, y = 0, z = 0, len = 0
      do {
        x = Math.random() * 2 - 1
        y = Math.random() * 2 - 1
        z = Math.random() * 2 - 1
        len = Math.sqrt(x * x + y * y + z * z)
      } while (len === 0 || len > 1)

      const r = innerRadius + Math.random() * (outerRadius - innerRadius)
      positions[i * 3]     = (x / len) * r
      positions[i * 3 + 1] = (y / len) * r * 0.6
      positions[i * 3 + 2] = (z / len) * r

      c.set(PALETTE[Math.floor(Math.random() * PALETTE.length)])
      // dim ramp — most very faint, a few brighter so the layer reads
      // as a population of unresolved stars, not a fog
      const b = Math.pow(Math.random(), 2.2) * 0.35 + 0.05
      colors[i * 3]     = c.r * b
      colors[i * 3 + 1] = c.g * b
      colors[i * 3 + 2] = c.b * b
    }

    return { positions, colors }
  }, [count, innerRadius, outerRadius])

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color"    args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        map={texture}
        size={1.4}
        sizeAttenuation
        vertexColors
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        transparent
        opacity={0.85}
        alphaTest={0.01}
      />
    </points>
  )
}
