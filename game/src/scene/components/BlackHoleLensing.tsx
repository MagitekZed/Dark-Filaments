import * as THREE from 'three'
import { BLACK_HOLE_AXIS_TILT } from '../sceneParams'

interface LensingProps {
  radius?: number
}

// Decorative gravitational-lensing approximation.
// Real lensing needs a custom shader that samples the scene texture with
// radial distortion around the BH silhouette. That requires integrating
// into the postprocessing chain, which is out of scope for the spike.
//
// What we do instead: layer extra bright rings that read AS lensing —
//   - a secondary "n=1" photon ring at slightly larger radius (light that
//     orbited the BH once before escaping)
//   - a wider half-arc above the disk plane (suggests the far side of the
//     accretion disk lensed up and over the top — the Interstellar look)
//   - a corresponding half-arc below
//
// With bloom these read as halos of stretched light around the BH.
export function BlackHoleLensing({ radius = 0.22 }: LensingProps) {
  return (
    <group>
      {/* secondary photon ring — thin, just outside the primary */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius * 1.55, radius * 0.018, 16, 128]} />
        <meshBasicMaterial
          color={0xfff8d8}
          blending={THREE.AdditiveBlending}
          transparent
          opacity={0.6}
          depthWrite={false}
        />
      </mesh>

      {/* upper warp arc — far side of disk lensed over the top */}
      <mesh rotation={BLACK_HOLE_AXIS_TILT}>
        <torusGeometry args={[radius * 1.95, radius * 0.06, 14, 96, Math.PI]} />
        <meshBasicMaterial
          color={0xffc890}
          blending={THREE.AdditiveBlending}
          transparent
          opacity={0.55}
          depthWrite={false}
        />
      </mesh>

      {/* lower warp arc — far side lensed under the bottom (axis flipped 180°
          but kept coupled to the shared BH axis tilt) */}
      <mesh rotation={[BLACK_HOLE_AXIS_TILT[0] + Math.PI, BLACK_HOLE_AXIS_TILT[1], BLACK_HOLE_AXIS_TILT[2]]}>
        <torusGeometry args={[radius * 1.95, radius * 0.06, 14, 96, Math.PI]} />
        <meshBasicMaterial
          color={0xffa870}
          blending={THREE.AdditiveBlending}
          transparent
          opacity={0.5}
          depthWrite={false}
        />
      </mesh>

      {/* very faint outer warp halo at a slight tilt — suggests space itself
          bending around the BH */}
      <mesh rotation={[Math.PI / 2.5, -0.1, 0.2]}>
        <torusGeometry args={[radius * 2.8, radius * 0.05, 12, 96]} />
        <meshBasicMaterial
          color={0xa86040}
          blending={THREE.AdditiveBlending}
          transparent
          opacity={0.22}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}
