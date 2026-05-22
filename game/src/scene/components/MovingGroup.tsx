import * as THREE from 'three'
import { KinematicsTracer } from './StellarKinematics'

export interface MovingGroupMember {
  position: [number, number, number]
  /** Host star radius — drives the tracer's startOffset so it
   *  emerges from the photosphere rather than the geometric center. */
  radius: number
}

interface MovingGroupProps {
  /** The 4–6 stars that belong to the moving group. */
  stars: MovingGroupMember[]
  /** Shared velocity direction. All members' tracers point this way. */
  direction: [number, number, number]
  /** Tracer length (defaults to a fixed value — moving group has no level). */
  length?: number
  /** Tracer base radius (default slightly thicker than Stellar
   *  Kinematics so the synchronized group reads as the dominant signal). */
  radius?: number
  /** Pale teal-green by default — distinct from Stellar Kinematics
   *  (pale blue) and Peculiar Velocity (warm magenta). */
  color?: THREE.Color
}

// Moving Group — a coherent population of stars that formed together
// and still shares a common space-velocity vector, but has drifted
// apart enough that the group is no longer gravitationally bound.
// Real-world examples: the Ursa Major Moving Group (most of the Big
// Dipper stars), the Hyades Moving Group, the Beta Pictoris group.
//
// Visual signature is synchronized proper motion across a subset of
// otherwise unrelated-looking stars. Reuses the KinematicsTracer
// primitive with a shared direction so the group's parallel arrows
// pop out of the scene — especially against the random-direction
// Stellar Kinematics tracers when both upgrades are active.

const DEFAULT_COLOR = new THREE.Color(0.50, 0.88, 0.78)  // pale teal-green

export function MovingGroup({
  stars,
  direction,
  length = 5.5,
  radius = 0.060,
  color = DEFAULT_COLOR,
}: MovingGroupProps) {
  if (stars.length === 0) return null

  return (
    <>
      {stars.map((s, i) => (
        <group key={i} position={s.position}>
          <KinematicsTracer
            direction={direction}
            length={length}
            radius={radius}
            startOffset={s.radius}
            color={color}
          />
        </group>
      ))}
    </>
  )
}
