import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { discTexture, diffractionTexture } from './discTexture'

// Two populations:
//   - Regular foreground stars (small bright dots, some binary/triple)
//   - A handful of *very* bright stars rendered with diffraction-spike
//     sprites — the cross-shape Hubble shows on Milky Way foreground
//     stars in deep-field images.
//
// Wrapped in a slowly-counter-rotating group → parallax against the
// background-galaxy layer.

const NUM_SYSTEMS = 16
const NUM_BRIGHT = 4
const SHELL_INNER = 8
const SHELL_OUTER = 28

const STAR_COLORS: string[] = [
  '#fffbe6', // G — sun-like
  '#fff8e0',
  '#ffffff', // A — pure white
  '#ddebff', // A/B — blue-white
  '#a8c4ff', // B — hot blue
  '#ffd6a8', // K — orange
  '#ffbd80',
  '#ff9060', // M — cool red
  '#ffe9c0', // F — yellow-white
]

const BRIGHT_COLORS: string[] = [
  '#ffffff',
  '#fff5d6',
  '#ddebff',
  '#a8c4ff',
  '#ffd6a8',
]

function randomShellPos(yBias: number): [number, number, number] {
  let dx = 0, dy = 0, dz = 0, dlen = 0
  do {
    dx = Math.random() * 2 - 1
    dy = (Math.random() * 2 - 1) * yBias
    dz = Math.random() * 2 - 1
    dlen = Math.sqrt(dx * dx + dy * dy + dz * dz)
  } while (dlen === 0 || dlen > 1)
  const dist = SHELL_INNER + Math.random() * (SHELL_OUTER - SHELL_INNER)
  return [(dx / dlen) * dist, (dy / dlen) * dist, (dz / dlen) * dist]
}

export function ForegroundStars() {
  const groupRef = useRef<THREE.Group>(null)
  const softTex = useMemo(() => discTexture(), [])
  const diffTex = useMemo(() => diffractionTexture(), [])

  const normalStars = useMemo(() => {
    const posList: number[] = []
    const colList: number[] = []
    const color = new THREE.Color()

    for (let s = 0; s < NUM_SYSTEMS; s++) {
      const [cx, cy, cz] = randomShellPos(1.4)
      color.set(STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)])

      // multiplicity
      let components = 1
      const r1 = Math.random()
      if (r1 < 0.08) components = 3
      else if (r1 < 0.30) components = 2

      const primary = 0.6 + Math.random() * 0.8

      for (let c = 0; c < components; c++) {
        const offsetMag = c === 0 ? 0 : 0.04 + Math.random() * 0.10
        const ang = Math.random() * Math.PI * 2
        posList.push(
          cx + Math.cos(ang) * offsetMag,
          cy + (c === 0 ? 0 : (Math.random() - 0.5) * 0.04),
          cz + Math.sin(ang) * offsetMag,
        )
        const b = c === 0 ? primary : primary * (0.35 + Math.random() * 0.35)
        colList.push(color.r * b, color.g * b, color.b * b)
      }
    }

    return {
      positions: new Float32Array(posList),
      colors: new Float32Array(colList),
    }
  }, [])

  const brightStars = useMemo(() => {
    const posList: number[] = []
    const colList: number[] = []
    const color = new THREE.Color()
    for (let s = 0; s < NUM_BRIGHT; s++) {
      // bright stars sit further out + biased away from the disc plane
      const [cx, cy, cz] = randomShellPos(1.7)
      // a touch brighter and pull them slightly closer to camera
      const scale = 0.75
      posList.push(cx * scale, cy * scale, cz * scale)
      color.set(BRIGHT_COLORS[Math.floor(Math.random() * BRIGHT_COLORS.length)])
      const b = 1.0
      colList.push(color.r * b, color.g * b, color.b * b)
    }
    return {
      positions: new Float32Array(posList),
      colors: new Float32Array(colList),
    }
  }, [])

  // slow drift opposite to background-galaxy layer — parallax cue
  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y -= delta * 0.0035
  })

  return (
    <group ref={groupRef}>
      {/* regular foreground stars (soft sprite) */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[normalStars.positions, 3]} />
          <bufferAttribute attach="attributes-color"    args={[normalStars.colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={3.5}
          sizeAttenuation={false}
          vertexColors
          map={softTex}
          alphaMap={softTex}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          transparent
        />
      </points>

      {/* brightest few — with diffraction spikes */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[brightStars.positions, 3]} />
          <bufferAttribute attach="attributes-color"    args={[brightStars.colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={26}
          sizeAttenuation={false}
          vertexColors
          map={diffTex}
          alphaMap={diffTex}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          transparent
          opacity={0.95}
        />
      </points>
    </group>
  )
}
