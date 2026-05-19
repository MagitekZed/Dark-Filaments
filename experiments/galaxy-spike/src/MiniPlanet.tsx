import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export interface MiniPlanetProps {
  /** Distance from the local origin (the parent star). */
  orbitRadius: number
  /** Seconds for one full revolution. */
  orbitPeriod: number
  /** Sphere radius. Keep small (0.020 – 0.090). */
  radius?: number
  /** Starting angle in radians. */
  initialAngle?: number
  /** Orbit-plane tilt (radians) about x-axis. */
  inclination?: number
  /** Dark surface color (sunspots / low ground / shadowed bands). */
  colorA?: string
  /** Mid surface color. */
  colorB?: string
  /** Bright surface color (peaks / highlights). */
  colorC?: string
  /** 0 = rocky terrain noise, 1 = full latitudinal banding (gas giant). */
  banded?: number
  /** Noise scale on the surface; higher = finer terrain. */
  noiseScale?: number
  /** Surface brightness multiplier. Default 0.7 — planets do not bloom. */
  brightness?: number
  /** If true, render a thin ring along the orbit path. */
  showOrbitRing?: boolean
  /** Ring color (defaults to a dim near-white). */
  ringColor?: string
  /** Ring opacity (0-1). */
  ringOpacity?: number
}

// Lightweight textured planet for tens-of-parsec scale.
//
// A small sphere with a custom ShaderMaterial. Surface is computed in the
// fragment shader via 3 octaves of value-noise FBM sampled at the local
// normal — so the surface pattern rotates with the planet rather than
// crawling. Three-color ramp from dark → mid → light gives terrain
// character. For gas giants (`banded > 0`) latitude is mixed in so the
// noise organizes into horizontal stripes.
//
// Planets are NOT emissive — they sit at brightness ~0.7 (below the
// 0.42 bloom threshold doesn't apply here because the planet sphere is
// rendered to the main pass, not to the bloom-extract; the brightness
// just controls perceived luminance). The nearby star's bloom halo
// makes the planet read as "lit" without needing a real light source.

const VERTEX_SHADER = /* glsl */`
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vLocalNormal;
  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vPosition = worldPos.xyz;
    vNormal   = normalize(mat3(modelMatrix) * normal);
    vLocalNormal = normalize(normal);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`

const FRAGMENT_SHADER = /* glsl */`
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;
  uniform float uBands;
  uniform float uNoiseScale;
  uniform float uBrightness;
  uniform float uSeed;
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vLocalNormal;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float noise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(
        mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
        mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x),
        f.y),
      mix(
        mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
        mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x),
        f.y),
      f.z);
  }
  float fbm(vec3 x) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 3; i++) {
      v += a * noise(x);
      x *= 2.1;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec3 viewDir = normalize(cameraPosition - vPosition);
    vec3 p = vLocalNormal * uNoiseScale + vec3(uSeed * 7.3);

    // base terrain noise
    float n = fbm(p);

    // For gas giants, mix the noise heavily toward latitude (vLocalNormal.y)
    // so terrain organizes into horizontal bands. Noise still ripples the
    // bands so they wobble nicely.
    float lat = vLocalNormal.y * 0.5 + 0.5;
    float bandN = sin(lat * 9.0 + n * 1.5) * 0.5 + 0.5;
    float surface = mix(n, bandN, uBands);

    // 3-color ramp
    vec3 col = mix(uColorA, uColorB, smoothstep(0.30, 0.55, surface));
    col      = mix(col,     uColorC, smoothstep(0.58, 0.82, surface));

    // limb darkening — softer at silhouette
    float fresnel = 1.0 - max(0.0, dot(vNormal, viewDir));
    col *= mix(1.0, 0.55, smoothstep(0.45, 1.0, fresnel));

    col *= uBrightness;

    gl_FragColor = vec4(col, 1.0);
  }
`

export function MiniPlanet({
  orbitRadius,
  orbitPeriod,
  radius = 0.045,
  initialAngle = 0,
  inclination = 0,
  colorA = '#3a2820',
  colorB = '#8a6850',
  colorC = '#d8b890',
  banded = 0,
  noiseScale = 3.8,
  brightness = 0.95,
  showOrbitRing = false,
  ringColor = '#5a6068',
  ringOpacity = 0.18,
}: MiniPlanetProps) {
  const groupRef = useRef<THREE.Group>(null)
  const meshRef = useRef<THREE.Mesh>(null)
  const startTime = useMemo(
    () => (initialAngle / (2 * Math.PI)) * orbitPeriod,
    [initialAngle, orbitPeriod],
  )
  const elapsed = useRef(startTime)

  // Stable per-planet seed so each planet's noise sample is different but
  // doesn't reshuffle between renders.
  const seed = useMemo(
    () => (initialAngle * 11 + orbitPeriod * 3 + orbitRadius * 7) % 31,
    [initialAngle, orbitPeriod, orbitRadius],
  )

  const uniforms = useMemo(() => ({
    uColorA:     { value: new THREE.Color(colorA) },
    uColorB:     { value: new THREE.Color(colorB) },
    uColorC:     { value: new THREE.Color(colorC) },
    uBands:      { value: banded },
    uNoiseScale: { value: noiseScale },
    uBrightness: { value: brightness },
    uSeed:       { value: seed },
  }), [colorA, colorB, colorC, banded, noiseScale, brightness, seed])

  useFrame((_, delta) => {
    elapsed.current += delta
    const angle = (elapsed.current / orbitPeriod) * Math.PI * 2
    if (groupRef.current) {
      const x = Math.cos(angle) * orbitRadius
      const z = Math.sin(angle) * orbitRadius
      groupRef.current.position.set(
        x,
        Math.sin(inclination) * z,
        Math.cos(inclination) * z,
      )
    }
    // slow planet rotation — adds a sense of "alive" at zoom-in
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.18
    }
  })

  return (
    <>
      {showOrbitRing && (
        <mesh rotation={[Math.PI / 2 + inclination, 0, 0]}>
          <ringGeometry args={[orbitRadius - 0.003, orbitRadius + 0.003, 96]} />
          <meshBasicMaterial
            color={ringColor}
            transparent
            opacity={ringOpacity}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}
      <group ref={groupRef}>
        <mesh ref={meshRef}>
          <sphereGeometry args={[radius, 24, 24]} />
          <shaderMaterial
            vertexShader={VERTEX_SHADER}
            fragmentShader={FRAGMENT_SHADER}
            uniforms={uniforms}
          />
        </mesh>
      </group>
    </>
  )
}
