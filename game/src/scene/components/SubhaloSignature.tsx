import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

// Subhalo — the T3 hidden-channel visual (SD-2: dark matter is inferred, not
// rendered).
//
// Real astronomy: a subhalo is a smaller dark matter halo bound within a larger
// one — ΛCDM predicts thousands per galaxy halo; most are entirely dark. The
// upgrade is the game's first HIDDEN mechanic: it has no footprint on the stats
// line. So its scene presence must NOT be luminous mass. Instead we render the
// only thing dark matter ever shows us — its effect on light: a faint, broken,
// shimmering Einstein-ring arc of LENSED BACKGROUND LIGHT bent around the unseen
// well. We infer its presence from what flows along it. The mass stays dark.
//
// The signature is deliberately understated — at low Subhalo levels it is barely
// a suggestion; even fully stacked it never becomes a bright object. As the
// level rises the ring brightens and its arcs fill in (a stronger lens).
//
// Camera-facing: real Einstein arcs are tangential around the lens center as the
// OBSERVER sees them, so the ring lies in the plane perpendicular to the view
// and re-orients as the camera drifts.

interface SubhaloSignatureProps {
  /** Subhalo upgrade level (0..99). Higher → a stronger, fuller lensing ring. */
  level: number
  /** Lens center (the cloud's dark matter well). */
  center?: [number, number, number]
  /** Einstein radius — sits just beyond the visible stellar population. */
  radius?: number
}

const RING_VERTEX = /* glsl */ `
  varying float vAngle;
  void main() {
    // Angle around the ring's main circle (torus lies in local xy plane).
    vAngle = atan(position.y, position.x);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// Alpha brightens into a few arcs around the ring (where a background source
// aligns) and shimmers slowly — a lens flickering as the line of sight wanders,
// never a solid object.
const RING_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform float uTime;
  varying float vAngle;
  void main() {
    float arcs =
      0.68 + 0.32 * sin(vAngle * 2.0 + uTime * 0.18) *
                    cos(vAngle * 3.0 - uTime * 0.11);
    arcs = clamp(arcs, 0.0, 1.0);
    float shimmer = 0.82 + 0.18 * sin(uTime * 0.9 + vAngle * 5.0);
    float alpha = uIntensity * arcs * shimmer;
    gl_FragColor = vec4(uColor * alpha, alpha);
  }
`

const RING_COLOR = new THREE.Color(0.72, 0.80, 1.0)

export function SubhaloSignature({
  level,
  center = [0, 0, 0],
  radius = 18,
}: SubhaloSignatureProps) {
  const { camera } = useThree()
  const groupRef = useRef<THREE.Group>(null)
  const timeRef = useRef(0)
  const tmpCenter = useRef(new THREE.Vector3())

  // Peak intensity is low and saturating — never a bright object. L1≈0.03,
  // L25≈0.10, L99≈0.16.
  const uniforms = useMemo(
    () => ({
      uColor: { value: RING_COLOR },
      uIntensity: { value: 0 },
      uTime: { value: 0 },
    }),
    [],
  )

  // Low and saturating — never a bright object, but perceptible as bent light.
  // L1≈0.06, L25≈0.16, L99≈0.24.
  const targetIntensity = level <= 0 ? 0 : Math.min(0.24, 0.22 * Math.sqrt(level / 99) + 0.04)

  useFrame((_, delta) => {
    timeRef.current += delta
    uniforms.uTime.value = timeRef.current
    // Ease intensity toward target so a fresh purchase fades the ring in.
    uniforms.uIntensity.value += (targetIntensity - uniforms.uIntensity.value) * Math.min(1, delta * 1.5)
    // Face the camera so the arcs stay tangential to the line of sight.
    if (groupRef.current) {
      tmpCenter.current.fromArray(center)
      groupRef.current.lookAt(camera.position)
    }
  })

  if (level <= 0) return null

  return (
    <group ref={groupRef} position={center}>
      <mesh>
        <torusGeometry args={[radius, 0.22, 10, 200]} />
        <shaderMaterial
          vertexShader={RING_VERTEX}
          fragmentShader={RING_FRAGMENT}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}
