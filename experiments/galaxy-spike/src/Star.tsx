import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { getBoost, nowSeconds, registerBoostable } from './clickBoost'

interface StarProps {
  radius?: number
  /**
   * Color temperature blend, 0 = cool red-orange dwarf, 1 = hot blue-white.
   * 0.55 gives a sun-like G-type.
   */
  temperature?: number
  /**
   * Base surface brightness multiplier. Defaults to 1.6 (the original
   * tuned value). Lower values dim the star uniformly.
   */
  brightness?: number
  /**
   * Optional gentle independent scintillation. Each axis is sampled from
   * sine waves with the given amplitude, period (seconds), and starting
   * phase. Set amplitude to 0 to disable.
   */
  scintillation?: {
    amplitude: number
    period: number
    phase: number
  }
  /**
   * Optional identifier for click-boost participation. When set, the star
   * registers as a boostable element; on tap, it may be chosen and gets
   * a brief (~1.5s) luminosity bump.
   */
  boostId?: string
  /**
   * Optional per-frame temperature override. When the ref has a non-null
   * value, the surface uniform `uTemperature` is set to it each frame —
   * letting the parent smoothly drive temperature transitions (e.g. the
   * Wolf-Rayet activation color shift) without re-rendering the Star and
   * losing its useMemo'd uniforms / running surface animation.
   */
  tempOverrideRef?: React.MutableRefObject<number | null>
  /**
   * Optional per-frame brightness override. When the ref has a non-null
   * value, it REPLACES the prop-derived brightness inside the same
   * scintillation + click-boost pipeline. null = use the prop normally.
   */
  brightnessOverrideRef?: React.MutableRefObject<number | null>
}

// Procedural star.
//
// A sphere mesh with a custom ShaderMaterial. Surface is computed in the
// fragment shader via 4 octaves of value-noise FBM sampled at the world
// position (drifted with time → boiling surface). Two octaves at different
// scales/speeds give the layered granulation + larger convection cell look.
//
// A color ramp maps noise value to: dark sunspot pits → warm orange →
// hot yellow-white. Limb darkening via fresnel dims the silhouette edge,
// making the sphere read as a 3D object even before bloom.
//
// All three lerps are temperature-shifted so the same shader handles
// everything from a cool red dwarf through a hot blue O-type. T1 will
// likely sit at G-type (~0.55).

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
  uniform float uTime;
  uniform float uTemperature;
  uniform float uBrightness;
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vLocalNormal;

  // value-noise hash + trilinear interpolation (cheap, organic-looking)
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
    for (int i = 0; i < 4; i++) {
      v += a * noise(x);
      x *= 2.0;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec3 viewDir = normalize(cameraPosition - vPosition);
    // Sample noise at LOCAL normal so the surface pattern is intrinsic to
    // the mesh — rotates with the star instead of crawling across it.
    vec3 p = vLocalNormal * 3.5;

    // two octaves of FBM scrolling in different directions → convection cells
    float n1 = fbm(p + vec3(uTime * 0.045, uTime * 0.030, -uTime * 0.040));
    float n2 = fbm(p * 2.8 + vec3(-uTime * 0.075, uTime * 0.090, uTime * 0.060));
    float surface = n1 * 0.65 + n2 * 0.65;

    // sunspots — decoupled from the fast surface boil. Large-scale, slow-
    // evolving noise field so individual spots are big and long-lived.
    float spotField = fbm(p * 0.55 + vec3(uTime * 0.008, uTime * 0.005, uTime * 0.006));
    float spot = smoothstep(0.30, 0.16, spotField);

    // temperature-blended color ramp
    // cool palette (red dwarf-ish)
    vec3 coolDark = vec3(0.10, 0.03, 0.01);
    vec3 coolMid  = vec3(0.90, 0.28, 0.05);
    vec3 coolHot  = vec3(1.00, 0.62, 0.20);
    // hot palette (blue O-type-ish)
    vec3 hotDark  = vec3(0.04, 0.06, 0.10);
    vec3 hotMid   = vec3(0.40, 0.60, 1.00);
    vec3 hotHot   = vec3(0.85, 0.95, 1.10);
    // sun-like (G-type) palette as the temperate center
    vec3 sunDark  = vec3(0.20, 0.07, 0.02);
    vec3 sunMid   = vec3(1.00, 0.55, 0.12);
    vec3 sunHot   = vec3(1.00, 0.92, 0.70);

    vec3 dark, mid, hot;
    if (uTemperature < 0.5) {
      float t = uTemperature * 2.0;
      dark = mix(coolDark, sunDark, t);
      mid  = mix(coolMid,  sunMid,  t);
      hot  = mix(coolHot,  sunHot,  t);
    } else {
      float t = (uTemperature - 0.5) * 2.0;
      dark = mix(sunDark, hotDark, t);
      mid  = mix(sunMid,  hotMid,  t);
      hot  = mix(sunHot,  hotHot,  t);
    }

    // tighter smoothsteps → sharper granule boundaries (more contrast)
    vec3 col = mix(dark, mid, smoothstep(0.36, 0.52, surface));
    col      = mix(col,  hot, smoothstep(0.58, 0.78, surface));

    // diffuse sunspot darkening — large-feature low-contrast
    col *= mix(1.0, 0.25, spot);

    // limb darkening — softer at the silhouette
    float fresnel = 1.0 - max(0.0, dot(vNormal, viewDir));
    col *= mix(1.0, 0.55, smoothstep(0.45, 1.0, fresnel));

    col *= uBrightness;

    // Deep sunspots applied AFTER brightness so they stay genuinely dark
    // in the final output (otherwise the brightness boost + neighbouring
    // bloom contribution drowns them). Bigger features (0.30× scale)
    // also give each spot a wider dark core that survives the bloom blur.
    float deepField = fbm(p * 0.30 + vec3(uTime * 0.0045, -uTime * 0.0035, uTime * 0.0050));
    float deep = smoothstep(0.28, 0.14, deepField);
    vec3 deepColor = vec3(0.18, 0.06, 0.012);
    col = mix(col, deepColor, deep);

    gl_FragColor = vec4(col, 1.0);
  }
`

const CORONA_FRAGMENT = /* glsl */`
  uniform float uTime;
  uniform vec3  uColor;
  varying vec3 vPosition;
  varying vec3 vNormal;

  void main() {
    vec3 viewDir = normalize(cameraPosition - vPosition);
    // strongest at the silhouette, fades toward facing-camera surface
    float fresnel = 1.0 - max(0.0, dot(vNormal, viewDir));
    // tighter falloff (pow 3.5 vs 2.5) → narrower corona band hugging
    // the silhouette, leaves more empty space for prominences to read in
    float alpha = pow(fresnel, 3.5);
    // brightness 1.0 (was 1.6) — gives arcs room to stand out
    vec3 col = uColor * alpha * 1.0;
    gl_FragColor = vec4(col, alpha);
  }
`

export function Star({
  radius = 1.0,
  temperature = 0.55,
  brightness = 1.6,
  scintillation,
  boostId,
  tempOverrideRef,
  brightnessOverrideRef,
}: StarProps) {
  useEffect(() => {
    if (!boostId) return
    return registerBoostable(boostId)
  }, [boostId])
  const surfaceMatRef = useRef<THREE.ShaderMaterial>(null)
  const surfaceMeshRef = useRef<THREE.Mesh>(null)

  const surfaceUniforms = useMemo(() => ({
    uTime:        { value: 0 },
    uTemperature: { value: temperature },
    uBrightness:  { value: brightness },
  }), [temperature, brightness])

  const coronaUniforms = useMemo(() => ({
    uTime:  { value: 0 },
    uColor: { value: new THREE.Color('#ffd28a') },
  }), [])

  useFrame((_, delta) => {
    if (surfaceMatRef.current) {
      surfaceUniforms.uTime.value += delta
      // The "current" brightness baseline. When a parent has supplied an
      // override ref (e.g. Wolf-Rayet activation lerping baseline → WR
      // brightness over time), use that as the base; otherwise the prop.
      const baseBrightness = brightnessOverrideRef?.current != null
        ? brightnessOverrideRef.current
        : brightness
      // Scintillation modulates the surface uniform live, so the value is
      // always recomputed from the base brightness — no drift across resets.
      let modulated = baseBrightness
      if (scintillation && scintillation.amplitude > 0) {
        const t = surfaceUniforms.uTime.value
        const wobble = Math.sin(
          (t / scintillation.period) * Math.PI * 2 + scintillation.phase,
        )
        modulated = baseBrightness * (1 + scintillation.amplitude * wobble)
      }
      // Click-boost modulates on top of scintillation. Wall-clock seconds
      // (NOT clock.elapsedTime — that's canvas-scoped and doesn't match
      // the start time fireRandomBoost records). When idle, returns 0.
      //
      // IMPORTANT: R3F/Three.js clones uniforms during ShaderMaterial
      // construction, so the GPU reads from material.uniforms — NOT from
      // our useMemo'd surfaceUniforms. Write to both to be safe.
      const boost = boostId ? getBoost(boostId, nowSeconds()) : 0
      const finalBrightness = modulated * (1 + boost)
      surfaceUniforms.uBrightness.value = finalBrightness
      const liveMat = surfaceMatRef.current as THREE.ShaderMaterial | null
      if (liveMat?.uniforms?.uBrightness) {
        liveMat.uniforms.uBrightness.value = finalBrightness
      }
      // Temperature override — lerping the surface color from baseline to
      // WR-hot during the activation transition. The fragment shader reads
      // uTemperature each pixel, so writing here repaints next frame.
      if (tempOverrideRef?.current != null && liveMat?.uniforms?.uTemperature) {
        liveMat.uniforms.uTemperature.value = tempOverrideRef.current
        surfaceUniforms.uTemperature.value = tempOverrideRef.current
      }
    }
    // slow self-rotation — adds a sense of "alive" without competing with the
    // surface boil. The Sun actually rotates at ~25 days; visible cycle here
    // is a few minutes per spin.
    if (surfaceMeshRef.current) {
      surfaceMeshRef.current.rotation.y += delta * 0.05
    }
  })

  return (
    <group>
      {/* core surface — bright procedural plasma */}
      <mesh ref={surfaceMeshRef}>
        <sphereGeometry args={[radius, 96, 96]} />
        <shaderMaterial
          ref={surfaceMatRef}
          vertexShader={VERTEX_SHADER}
          fragmentShader={FRAGMENT_SHADER}
          uniforms={surfaceUniforms}
        />
      </mesh>

      {/* corona — additive halo that fades at the surface and blooms outward */}
      <mesh>
        <sphereGeometry args={[radius * 1.35, 48, 48]} />
        <shaderMaterial
          vertexShader={VERTEX_SHADER}
          fragmentShader={CORONA_FRAGMENT}
          uniforms={coronaUniforms}
          blending={THREE.AdditiveBlending}
          transparent
          depthWrite={false}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  )
}
