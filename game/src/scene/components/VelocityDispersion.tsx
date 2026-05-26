import { useMemo } from 'react'
import * as THREE from 'three'
import { KinematicsTracer } from './StellarKinematics'

// Velocity Dispersion — the T3 completionist (max-5) visual.
//
// Real astronomy: the statistical spread of line-of-sight stellar velocities in
// a bound system. For a virialized system σ² ∝ M/R, so the measured σ infers the
// total dynamical mass. In dwarf spheroidals the observed σ (~10 km/s) is FAR
// higher than the visible stars could produce — the smoking gun for dark matter.
// And the motion is ISOTROPIC: the stars move every which way (pressure support),
// not in coherent rotation. That randomness is the content — the number that
// does not fit is the number we have been looking for.
//
// Visual: faint motion vectors on a sample of cloud stars, pointing in RANDOM
// (seeded, isotropic) directions — deliberately the opposite of T2's coherent
// Moving Group. Cool violet to read as a dark-matter inference rather than a
// luminous feature. Each of the 5 completionist levels reveals another batch and
// lengthens the vectors (a higher inferred σ).

interface VelocityDispersionProps {
  /** Completionist level, 1..5. */
  level: number
  /** Spatial half-extent the sampled stars sit within. */
  radius?: number
}

const PER_LEVEL = 5
const MAX_VECTORS = PER_LEVEL * 5 // 25 at level 5
const DISPERSION_COLOR = new THREE.Color(0.62, 0.55, 0.92)

function hash01(x: number): number {
  const y = Math.sin(x) * 43758.5453
  return y - Math.floor(y)
}

export function VelocityDispersion({ level, radius = 13 }: VelocityDispersionProps) {
  const count = Math.max(0, Math.min(MAX_VECTORS, Math.round(level) * PER_LEVEL))
  // Higher level → longer vectors (a higher inferred dispersion).
  const lengthScale = 2.4 + Math.min(5, level) * 0.32

  const vectors = useMemo(() => {
    const list: {
      pos: [number, number, number]
      dir: [number, number, number]
      length: number
    }[] = []
    for (let i = 0; i < count; i++) {
      // Star position, biased toward the core.
      const r = radius * Math.pow(hash01(i * 5.9 + 2.2), 0.66)
      const phi = hash01(i * 3.1 + 4.8) * Math.PI * 2
      const cosTheta = hash01(i * 7.7 + 1.1) * 2 - 1
      const sinTheta = Math.sqrt(1 - cosTheta * cosTheta)
      const pos: [number, number, number] = [
        r * sinTheta * Math.cos(phi),
        r * cosTheta * 0.72,
        r * sinTheta * Math.sin(phi) * 0.9,
      ]
      // Isotropic random direction (the dispersion — no shared sense of motion).
      const dx = hash01(i * 2.7 + 9.3) * 2 - 1
      const dy = hash01(i * 4.4 + 6.6) * 2 - 1
      const dz = hash01(i * 6.2 + 3.7) * 2 - 1
      const dlen = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1
      const dir: [number, number, number] = [dx / dlen, dy / dlen, dz / dlen]
      // Per-star length variance (a spread of speeds).
      const length = lengthScale * (0.7 + hash01(i * 8.1 + 0.5) * 0.6)
      list.push({ pos, dir, length })
    }
    return list
  }, [count, radius, lengthScale])

  if (count === 0) return null

  return (
    <>
      {vectors.map((v, i) => (
        <group key={i} position={v.pos}>
          <KinematicsTracer
            direction={v.dir}
            length={v.length}
            radius={0.05}
            color={DISPERSION_COLOR}
          />
        </group>
      ))}
    </>
  )
}
