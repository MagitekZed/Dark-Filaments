import { useMemo } from 'react'
import * as THREE from 'three'

interface LocalBubbleProps {
  /** Current Local Bubble upgrade level, 0..99. */
  level: number
  /** World-space center. Anchored to the player star position. */
  center: [number, number, number]
}

// Local Bubble — the ~300 ly cavity our solar system actually lives
// inside, carved by nearby supernovae over the last 10–20 Myr. It's
// filled with hot (~10⁶ K) low-density ionised hydrogen that emits soft
// X-rays detectable against the rest of the local ISM (Bowyer 1968,
// ROSAT and DXL all-sky surveys).
//
// Rendered as a soft fresnel-edge sphere: transparent through the
// middle, glowing X-ray-cyan at the silhouette where the sight line is
// tangent to the cavity wall. Additive blending makes the rim read as
// emission rather than a solid surface. The bubble is centered on the
// player star and grows with upgrade level — at L99 it engulfs the
// nearest neighbour stars, mirroring the real-world geometry where the
// Local Bubble contains many nearby stars beyond the Sun.

const BUBBLE_VERTEX = /* glsl */`
  varying vec3 vWorldPos;
  varying vec3 vNormal;
  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    vNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`

const BUBBLE_FRAGMENT = /* glsl */`
  uniform vec3 uColorRim;
  uniform vec3 uColorCore;
  uniform float uIntensity;
  varying vec3 vWorldPos;
  varying vec3 vNormal;
  void main() {
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    // Fresnel — strong at silhouette (rim), weak facing the camera.
    float fresnel = 1.0 - max(0.0, dot(vNormal, viewDir));
    float rim = pow(fresnel, 1.6);
    // A faint core haze so the bubble isn't just an edge halo — gives
    // the interior a sense of being a hot, dim volume rather than
    // empty space. Bumped enough that the bubble stays visible when
    // its rim drifts past the viewport edge at high level.
    float core = 0.18 * (1.0 - rim);
    vec3 col = uColorRim * rim * uIntensity + uColorCore * core * uIntensity;
    float alpha = rim * uIntensity + core * 0.5;
    gl_FragColor = vec4(col, alpha);
  }
`

/** World-space radius + rim-glow intensity at a given upgrade level.
    L25 is the calibrated baseline (radius engulfs the 1–2 nearest
    neighbour stars; intensity reads clearly without dominating).
    L10 stays faint and small ("a hint of cavity"). L99 plateaus —
    the bubble keeps growing in opacity, but the radius saturates so
    the rim stays on-screen at default zoom.
    Stylized down from the real Local Bubble's ~300 ly scale (which
    at our scene's parsec-scale interpretation would be larger than
    the entire visible field). */
export function localBubbleVisuals(level: number): { radius: number; intensity: number } {
  if (level <= 0) return { radius: 0, intensity: 0 }
  // Piecewise growth: linear 0→16 across L0-25 (calibrated baseline
  // at L25 engulfs the nearest 1–2 neighbours), then slower 16→22
  // across L25-99 so the rim stays mostly on-screen at default zoom
  // and the bubble keeps reading as a discrete object rather than an
  // ambient blue-shift across the whole view.
  const radius = level <= 25
    ? 16 * (level / 25)               // L10≈6.4, L25=16
    : 16 + 6 * (level - 25) / 74      // L50≈18, L99=22
  // Intensity scales sqrt(level/25) so L10 is subtle and L99 maxes
  // out at 0.55 (capped — never blinding).
  const intensity = Math.min(0.55, 0.35 * Math.sqrt(level / 25))
  return { radius, intensity }
}

export function LocalBubble({ level, center }: LocalBubbleProps) {
  const { radius, intensity } = localBubbleVisuals(level)

  const uniforms = useMemo(() => ({
    uColorRim:  { value: new THREE.Color('#5a90d8') },  // soft X-ray cyan-blue
    uColorCore: { value: new THREE.Color('#284878') },  // dim violet-blue interior
    uIntensity: { value: intensity },
  }), [intensity])

  if (level <= 0 || radius <= 0) return null

  return (
    <mesh position={center}>
      {/* Higher segment count keeps the silhouette smooth at the
          radii we use here. FrontSide only: rendering both sides
          stacks the rim term across the whole sphere and fills it
          in as a solid disc. */}
      <sphereGeometry args={[radius, 64, 48]} />
      <shaderMaterial
        vertexShader={BUBBLE_VERTEX}
        fragmentShader={BUBBLE_FRAGMENT}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.FrontSide}
      />
    </mesh>
  )
}
