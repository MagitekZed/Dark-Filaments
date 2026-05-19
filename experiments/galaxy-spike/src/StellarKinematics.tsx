import { useMemo } from 'react'
import * as THREE from 'three'

// Stellar Kinematics — quiet/ambient diagnostic upgrade visual.
//
// Real astronomy: every star has its own proper motion (apparent motion
// across the sky) + radial velocity (motion toward/away from us). You
// can't see this with your eye — only measure it. The Gaia mission has
// done this for >1 billion stars; visualizations typically show faint
// arrows from each star pointing in the direction of motion.
//
// Implementation note: each FieldStarSystem mounts a KinematicsTracer
// directly inside its bobbing group, so the tracer stays attached to
// the star core through the slow per-system bobbing. The tracer's
// `startOffset` is set from the host star's radius so the visible
// fade emerges from the photosphere rather than the geometric center.
//
// Level → look uses an sqrt curve where L25 = 1.0× (the calibration
// baseline; most players never push much past this) and L99 ≈ 2× L25.

/** Stable unit vector from an integer seed. y-component damped so
    motion sits mostly in the galactic plane. */
export function hashKinematicsDirection(seed: number): [number, number, number] {
  const h = (n: number) => {
    const x = Math.sin(seed * 1234.5 + n * 789.1) * 43758.5
    return (x - Math.floor(x)) * 2 - 1
  }
  let x = h(1)
  let y = h(2) * 0.4
  let z = h(3)
  const len = Math.sqrt(x * x + y * y + z * z) || 1
  return [x / len, y / len, z / len]
}

/** Length + radius for a kinematics tracer at a given upgrade level.
    L25 is the calibrated baseline; L99 lands at roughly 2× this. */
export function kinematicsForLevel(level: number): { length: number; radius: number } {
  if (level <= 0) return { length: 0, radius: 0 }
  const scale = Math.sqrt(level / 25)  // L10≈0.63, L25=1.0, L50≈1.41, L99≈1.99
  return {
    length: 5.0 * scale,    // L10≈3.15, L25=5.0, L50≈7.07, L99≈9.93
    radius: 0.040 * scale,
  }
}

interface KinematicsTracerProps {
  /** Unit vector pointing in the tracer's direction. */
  direction: [number, number, number]
  /** Tracer length in world units. */
  length: number
  /** Base radius (cylinder narrows toward the tip). */
  radius: number
  /** How far along `direction` the tracer base sits. Pass the host
   *  star's radius so the tracer emerges from the photosphere rather
   *  than the geometric center. */
  startOffset?: number
  /** Color (used as the additive tint). */
  color?: THREE.Color
}

const DEFAULT_KINEMATICS_COLOR = new THREE.Color(0.55, 0.65, 0.85)

// Soft-fade vector marker. Cylinder geometry with a custom shader that
// drives alpha based on the local Y position so the tracer bright-glows
// at the base and softly disperses toward the tip. Additive blending
// makes the fade read as light dissolving rather than a hard cutoff.
const TRACER_VERTEX = /* glsl */`
  uniform float uLength;
  varying float vT;
  void main() {
    vT = (position.y / uLength) + 0.5;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const TRACER_FRAGMENT = /* glsl */`
  uniform vec3 uColor;
  uniform float uIntensity;
  varying float vT;
  void main() {
    float alpha = uIntensity * pow(1.0 - vT, 1.7);
    gl_FragColor = vec4(uColor * alpha, alpha);
  }
`

/** A single kinematics tracer rendered at LOCAL ORIGIN. Mount it
    inside the parent star's group so it bobs along with the star. */
export function KinematicsTracer({
  direction,
  length,
  radius,
  startOffset = 0,
  color = DEFAULT_KINEMATICS_COLOR,
}: KinematicsTracerProps) {
  const { midPos, quaternion } = useMemo(() => {
    const dir = new THREE.Vector3(direction[0], direction[1], direction[2]).normalize()
    const up = new THREE.Vector3(0, 1, 0)
    const q = new THREE.Quaternion().setFromUnitVectors(up, dir)
    const mid: [number, number, number] = [
      dir.x * (startOffset + length / 2),
      dir.y * (startOffset + length / 2),
      dir.z * (startOffset + length / 2),
    ]
    return { midPos: mid, quaternion: q }
  }, [direction, length, startOffset])

  const uniforms = useMemo(() => ({
    uColor:     { value: color },
    uLength:    { value: length },
    uIntensity: { value: 0.65 },
  }), [color, length])

  if (length <= 0 || radius <= 0) return null

  return (
    <mesh position={midPos} quaternion={quaternion}>
      <cylinderGeometry args={[radius * 0.18, radius, length, 18]} />
      <shaderMaterial
        vertexShader={TRACER_VERTEX}
        fragmentShader={TRACER_FRAGMENT}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}
