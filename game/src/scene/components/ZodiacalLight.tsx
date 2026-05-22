import { useMemo } from 'react'
import * as THREE from 'three'
import { discTexture } from './discTexture'

interface ZodiacalLightProps {
  innerRadius?: number
  outerRadius?: number
  count?: number
  /** Vertical thickness — keep small, real zodiacal dust is tightly in-plane. */
  thickness?: number
  /** Live-tweenable opacity on the points material. */
  opacity?: number
}

// Zodiacal light — interplanetary dust scattered along the ecliptic plane,
// concentrated near the sun and fading with distance. The "false dawn" you
// see at twilight in dark-sky locations. Visualized as a thin warm-tinted
// disc of dim particles between the sun and Jupiter's orbit.
//
// Static (no orbital motion) — dust appears continuous and persistent on
// human timescales. Density biased heavily toward inner radii.

const PALETTE = [
  '#c89860',
  '#d8a878',
  '#a87c50',
  '#b88858',
  '#daa470',
]

export function ZodiacalLight({
  innerRadius = 1.5,
  outerRadius = 9.5,
  count = 1500,
  thickness = 0.10,
  opacity = 0.50,
}: ZodiacalLightProps) {
  const texture = useMemo(() => discTexture(), [])

  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const palette = PALETTE.map(c => new THREE.Color(c))
    const tmp = new THREE.Color()

    for (let i = 0; i < count; i++) {
      // bias r toward inner — much more dust near the sun
      const u = Math.random()
      const t = Math.pow(u, 2.0)
      const r = innerRadius + t * (outerRadius - innerRadius)
      const angle = Math.random() * Math.PI * 2
      // Gaussian-ish vertical thinning
      const y = (Math.random() - 0.5) * thickness * Math.pow(Math.random(), 0.5)

      positions[i * 3]     = Math.cos(angle) * r
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = Math.sin(angle) * r

      tmp.copy(palette[Math.floor(Math.random() * palette.length)])
      // brightness falls off with distance from the sun
      const radialDim = Math.pow(1 - t, 1.3)
      const variance = 0.45 + Math.random() * 0.55
      const brightness = radialDim * variance * 0.65

      colors[i * 3]     = tmp.r * brightness
      colors[i * 3 + 1] = tmp.g * brightness
      colors[i * 3 + 2] = tmp.b * brightness
    }
    return { positions, colors }
  }, [innerRadius, outerRadius, count, thickness])

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color"    args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.060}
        sizeAttenuation
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
