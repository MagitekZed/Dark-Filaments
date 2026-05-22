import { useMemo } from 'react'
import * as THREE from 'three'

// A dense layer of very dim deep-background pinpoints — the soft
// "everywhere a little bit of light" feeling of a Hubble deep field.
// Tiny, sizeAttenuation: false so they stay legible at any zoom, scattered
// across a much wider shell than the regular Starfield.

const COUNT = 6000
const INNER = 100
const OUTER = 240

// Slight tint variation — most neutral-cool, a few warmer
const TINTS: string[] = [
  '#c6cee8', '#c6cee8', '#c6cee8', '#c6cee8',
  '#d6dcef', '#d6dcef',
  '#b8c2dd', '#b8c2dd',
  '#dccdb8', '#e6d2b8',  // warm pinpoints (older / further redshift)
  '#c4b8d6',             // slight cool-violet
]

export function DeepStarfield() {
  const { positions, colors } = useMemo(() => {
    const posArr = new Float32Array(COUNT * 3)
    const colArr = new Float32Array(COUNT * 3)
    const c = new THREE.Color()
    for (let i = 0; i < COUNT; i++) {
      let x = 0, y = 0, z = 0, len = 0
      do {
        x = Math.random() * 2 - 1
        y = Math.random() * 2 - 1
        z = Math.random() * 2 - 1
        len = Math.sqrt(x * x + y * y + z * z)
      } while (len === 0 || len > 1)
      const r = INNER + Math.random() * (OUTER - INNER)
      posArr[i * 3]     = (x / len) * r
      posArr[i * 3 + 1] = (y / len) * r
      posArr[i * 3 + 2] = (z / len) * r

      c.set(TINTS[Math.floor(Math.random() * TINTS.length)])

      // directional density modulation — sample a wiggly function of the
      // direction vector to create patches where stars are brighter (suggests
      // local stellar associations) and patches where they're dim. The eye
      // reads this as "structure" without forming literal constellations.
      const dx = x / len, dy = y / len, dz = z / len
      const density = (
        Math.sin(dx * 4.0 + dy * 1.7) * Math.cos(dy * 5.1 - dz * 2.3) +
        Math.sin(dy * 3.3 + dz * 4.9) * Math.cos(dz * 2.7 - dx * 3.5) +
        Math.sin(dz * 6.0 - dx * 1.2) * Math.cos(dx * 4.3 + dy * 3.7)
      ) / 3.0  // ~[-1, 1]
      const densityBoost = 1.0 + density * 0.55

      // per-pinpoint brightness variance — many faint, a few brighter
      const b = (Math.pow(Math.random(), 1.8) * 0.65 + 0.15) * densityBoost
      colArr[i * 3]     = c.r * Math.max(0, b)
      colArr[i * 3 + 1] = c.g * Math.max(0, b)
      colArr[i * 3 + 2] = c.b * Math.max(0, b)
    }
    return { positions: posArr, colors: colArr }
  }, [])

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color"    args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={1.0}
        sizeAttenuation={false}
        vertexColors
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        transparent
        opacity={0.85}
      />
    </points>
  )
}
