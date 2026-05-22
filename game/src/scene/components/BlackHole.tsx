import * as THREE from 'three'

interface BlackHoleProps {
  radius?: number
}

// Central supermassive black hole — minimal core.
// - Event horizon: pure-black opaque sphere that writes depth, so bulge
//   particles behind it are occluded (the visual "shadow").
// - Photon ring: thin bright torus around the horizon. This one *is* a
//   real circular feature (the photon sphere at 1.5 r_s for Schwarzschild),
//   so a torus is appropriate.
//
// The accretion disc itself is rendered separately (BlackHoleAccretionDisc)
// as a particle system, since the torus geometry was reading like a
// planetary ring.

export function BlackHole({ radius = 0.22 }: BlackHoleProps) {
  return (
    <group>
      {/* event horizon — opaque, writes depth, occludes background */}
      <mesh renderOrder={1}>
        <sphereGeometry args={[radius, 48, 48]} />
        <meshBasicMaterial color={0x000000} depthWrite />
      </mesh>

      {/* photon ring — thin bright loop just outside the horizon */}
      <mesh rotation={[Math.PI / 2, 0, 0]} renderOrder={2}>
        <torusGeometry args={[radius * 1.32, radius * 0.04, 16, 128]} />
        <meshBasicMaterial
          color={0xfff0c0}
          blending={THREE.AdditiveBlending}
          transparent
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}
