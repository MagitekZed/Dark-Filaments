import { useMemo } from 'react'
import * as THREE from 'three'
import { sparkTexture } from './discTexture'

interface BrownDwarfsProps {
  /** Number of brown dwarfs visible. Max 5 — clamped automatically. */
  level: number
}

// Brown dwarfs — substellar objects between 13 and 80 Jupiter masses,
// too small to ignite hydrogen fusion. They emit only faint infrared
// from slow gravitational contraction; in real astronomy they're
// "the mass that never lit." Gravitationally significant, visually
// almost invisible.
//
// Each level reveals one dwarf at a fixed peripheral position. All
// five are placed within the default-view frustum so the player can
// see the progression without orbiting the camera. They render as
// dim red points via sparkTexture — no bloom, no halo, no prominence
// arcs. (SD-2 hint: "inferred, not rendered.")
//
// Positions chosen to spread across the four quadrants around the
// player star with each level, so progression L1 → L5 fills the
// scene with growing infrared presence.
const BROWN_DWARF_POSITIONS: [number, number, number][] = [
  [-3,  -8, 18],   // L1: bottom-center, close to camera
  [11,   7,  4],   // L2: upper-right
  [-15, -3,  6],   // L3: bottom-left
  [-10,  6, 10],   // L4: upper-left
  [12,  -4, 14],   // L5: bottom-right
]

const MAX_DWARFS = BROWN_DWARF_POSITIONS.length

// Deep IR-red palette. Slightly varied per-dwarf so they don't all
// look identical.
const DWARF_COLORS: [number, number, number][] = [
  [0.78, 0.24, 0.12],   // deep red
  [0.85, 0.28, 0.14],   // brighter red
  [0.72, 0.20, 0.10],   // dim red
  [0.80, 0.32, 0.18],   // warm red-brown
  [0.75, 0.22, 0.11],   // dim red
]

export function BrownDwarfs({ level }: BrownDwarfsProps) {
  const texture = useMemo(() => sparkTexture(), [])

  const count = Math.max(0, Math.min(level, MAX_DWARFS))

  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(MAX_DWARFS * 3)
    const col = new Float32Array(MAX_DWARFS * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 0] = BROWN_DWARF_POSITIONS[i][0]
      pos[i * 3 + 1] = BROWN_DWARF_POSITIONS[i][1]
      pos[i * 3 + 2] = BROWN_DWARF_POSITIONS[i][2]
      col[i * 3 + 0] = DWARF_COLORS[i][0]
      col[i * 3 + 1] = DWARF_COLORS[i][1]
      col[i * 3 + 2] = DWARF_COLORS[i][2]
    }
    return { positions: pos, colors: col }
  }, [count])

  if (count === 0) return null

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={count}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
          count={count}
        />
      </bufferGeometry>
      <pointsMaterial
        size={1.8}
        sizeAttenuation
        map={texture}
        vertexColors
        transparent
        opacity={0.85}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
        alphaTest={0.01}
      />
    </points>
  )
}
