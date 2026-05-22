import { useMemo } from 'react'
import * as THREE from 'three'
import { discTexture } from './discTexture'

interface HeliopauseProps {
  /** Mean radius of the heliopause shell (sun-centered). */
  radius?: number
  /** Asymmetry — the heliosphere is squashed in the direction of the
   *  Sun's motion through the interstellar medium ("bow shock" side),
   *  and trails out the other side ("heliotail"). 0 = perfect sphere. */
  asymmetry?: number
  /** Particle count on the shell. */
  count?: number
  /** Live-tweenable opacity on the points material. */
  opacity?: number
}

// Heliopause — the boundary where solar wind transitions to interstellar
// medium. Visualized as a faint particle shell around the sun, asymmetric
// like the real thing (compressed on the bow-shock side, elongated on the
// heliotail side). Sits well past Saturn so the rest of the solar system
// is clearly nested inside it.

const SHELL_COLORS = [
  '#a85020', // bow-shock side: warmer (compressed plasma)
  '#8a3818',
  '#604020',
  '#5040a0', // tail side: cooler / dimmer
  '#403080',
  '#604888',
]

export function Heliopause({
  radius = 18.5,
  asymmetry = 0.25,
  count = 1600,
  opacity = 0.55,
}: HeliopauseProps) {
  const texture = useMemo(() => discTexture(), [])

  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const palette = SHELL_COLORS.map(c => new THREE.Color(c))
    const color = new THREE.Color()

    // bow-shock direction (sun's motion through ISM) — arbitrary axis;
    // pick +X for visual clarity.
    const bowDir = new THREE.Vector3(1, 0, 0.2).normalize()
    const dir = new THREE.Vector3()

    for (let i = 0; i < count; i++) {
      // random direction on sphere (rejection sample for uniformity)
      let l = 0
      do {
        dir.set(
          Math.random() * 2 - 1,
          Math.random() * 2 - 1,
          Math.random() * 2 - 1,
        )
        l = dir.length()
      } while (l < 0.1 || l > 1)
      dir.divideScalar(l)

      // bow-shock asymmetry: cos(angle to bow direction) modulates radius.
      // +1 toward bow = compressed (closer); -1 (toward tail) = expanded.
      const bowAlign = dir.dot(bowDir)
      const radialMul = 1.0 - asymmetry * bowAlign + asymmetry * 0.8 * (1 - bowAlign) * 0.5
      const r = radius * radialMul

      // Gaussian thickness so the boundary feels like a layer, not a hard shell
      const thicknessJitter = (Math.random() - 0.5) * 1.6
      const finalR = r + thicknessJitter

      positions[i * 3]     = dir.x * finalR
      positions[i * 3 + 1] = dir.y * finalR * 0.5  // squashed vertically — sun's motion is mostly in disc plane
      positions[i * 3 + 2] = dir.z * finalR

      // color tied to bow alignment: warm on bow side, cool/violet on tail
      const tailFrac = (1 - bowAlign) * 0.5 // 0 at bow, 1 at tail
      if (tailFrac < 0.5) color.copy(palette[0]).lerp(palette[2], tailFrac * 2)
      else                color.copy(palette[3]).lerp(palette[5], (tailFrac - 0.5) * 2)

      const brightness = (0.45 + Math.random() * 0.55) *
                         (0.55 + Math.abs(bowAlign) * 0.45) // bow + tail extremes brighter than sides
      colors[i * 3]     = color.r * brightness
      colors[i * 3 + 1] = color.g * brightness
      colors[i * 3 + 2] = color.b * brightness
    }
    return { positions, colors }
  }, [radius, asymmetry, count])

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color"    args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.14}
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
