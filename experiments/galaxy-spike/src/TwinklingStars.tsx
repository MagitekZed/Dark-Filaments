import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { diffractionTexture } from './discTexture'

// A small set of named bright stars with animated twinkle, embedded in
// the galactic plane and rotating with the disc.
//
// Each star has a base color + base brightness plus a per-star twinkle
// pattern (sum of two out-of-phase sines so the variation feels organic).
// Bloom amplifies the cycle — as the star brightens it crosses the bloom
// luminance threshold and visibly "lights up," then dims back down.
//
// Position is in the galaxy's LOCAL frame (y = 0 puts them in the disc
// plane). The outer group applies the galaxy's tilt; the inner group
// applies the galaxy's spin at the same rate as the spinRef inside
// Galaxy.tsx, keeping the stars locked to the disc as it rotates.

interface Star {
  // local-frame position; y should be ~0 to sit in the galactic plane
  position: [number, number, number]
  baseColor: string
  baseBrightness: number
  speed1: number
  speed2: number
  amplitude: number
  phase: number
}

const STARS: Star[] = [
  // warm yellow, outer arm
  {
    position: [3.5, 0.0, -2.0],
    baseColor: '#ffd690',
    baseBrightness: 0.62,
    speed1: 1.9,
    speed2: 3.4,
    amplitude: 0.55,
    phase: 0,
  },
  // cool cyan, opposite arm
  {
    position: [-3.8, 0.0, 2.3],
    baseColor: '#b8e0ff',
    baseBrightness: 0.55,
    speed1: 2.7,
    speed2: 4.3,
    amplitude: 0.65,
    phase: 1.7,
  },
]

// Matches Galaxy.tsx spinRef rotation rate so the stars track the disc.
const GALAXY_SPIN_RATE = 0.04

export function TwinklingStars() {
  const spinRef = useRef<THREE.Group>(null)
  const geomRef = useRef<THREE.BufferGeometry>(null)
  const texture = useMemo(() => diffractionTexture(), [])

  const positions = useMemo(() => {
    const arr = new Float32Array(STARS.length * 3)
    STARS.forEach((s, i) => {
      arr[i * 3]     = s.position[0]
      arr[i * 3 + 1] = s.position[1]
      arr[i * 3 + 2] = s.position[2]
    })
    return arr
  }, [])

  const colors = useMemo(() => new Float32Array(STARS.length * 3), [])
  const baseColors = useMemo(() => STARS.map(s => new THREE.Color(s.baseColor)), [])
  const timeRef = useRef(0)

  useFrame((_, delta) => {
    timeRef.current += delta
    const t = timeRef.current

    // twinkle — per-star brightness modulation
    for (let i = 0; i < STARS.length; i++) {
      const s = STARS[i]
      const wave = 0.6 * Math.sin(t * s.speed1 + s.phase) +
                   0.4 * Math.sin(t * s.speed2 + s.phase * 1.7)
      const flicker = 1 + s.amplitude * wave
      const b = s.baseBrightness * Math.max(0, flicker)
      const c = baseColors[i]
      colors[i * 3]     = c.r * b
      colors[i * 3 + 1] = c.g * b
      colors[i * 3 + 2] = c.b * b
    }
    if (geomRef.current) {
      geomRef.current.attributes.color.needsUpdate = true
    }

    // galactic spin — match Galaxy.tsx
    if (spinRef.current) spinRef.current.rotation.y += delta * GALAXY_SPIN_RATE
  })

  return (
    // outer group: same tilt as the galaxy
    <group rotation={[-0.45, 0, 0.18]}>
      {/* inner group: spins to match the galaxy's disc rotation */}
      <group ref={spinRef}>
        <points>
          <bufferGeometry ref={geomRef}>
            <bufferAttribute attach="attributes-position" args={[positions, 3]} />
            <bufferAttribute attach="attributes-color"    args={[colors, 3]} />
          </bufferGeometry>
          <pointsMaterial
            size={20}
            sizeAttenuation={false}
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
    </group>
  )
}
