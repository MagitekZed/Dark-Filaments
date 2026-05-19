import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { getBoost, nowSeconds, registerBoostable } from './clickBoost'
import * as THREE from 'three'

export interface PlanetRingsConfig {
  /** Inner ring radius as a multiplier on planetRadius. */
  innerRadius: number
  /** Outer ring radius as a multiplier on planetRadius. */
  outerRadius: number
  color: string
  /** Number of visible radial bands across the ring system. */
  bandCount?: number
  opacity?: number
}

export interface PlanetProps {
  orbitRadius?: number
  orbitPeriod?: number
  initialOrbitAngle?: number
  planetRadius?: number
  axialTilt?: number
  rotationPeriod?: number
  /** 'rocky' = FBM elevation → ocean/land/ice. 'gas' = latitude-banded clouds. */
  planetType?: 'rocky' | 'gas'
  /** Palette stops — interpretation depends on planetType. */
  colorA?: string  // rocky: deep ocean   | gas: band-low
  colorB?: string  // rocky: land mid     | gas: band-mid
  colorC?: string  // rocky: mountain     | gas: band-high
  colorD?: string  // rocky: polar ice    | gas: polar darkening
  /** FBM sampling scale on surface. Higher = finer features. */
  noiseScale?: number
  /** Show polar ice caps (rocky planets). */
  showIce?: boolean
  /** Cloud layer coverage 0-1. 0 = none, 1 = solid overcast. */
  cloudCoverage?: number
  /** Mercury-style cratered darkening. */
  craters?: boolean
  /** Great Red Spot (Jupiter-only feature). */
  hasRedSpot?: boolean
  /**
   * Gas-giant band contrast multiplier. 1.0 = strong Jupiter-style bands.
   * Lower (e.g. 0.4) = subtle Saturn-style banding. No effect on rocky planets.
   */
  bandContrast?: number
  atmosphereColor?: string
  /** Atmosphere strength multiplier 0-1. 0 = no atmosphere shell. */
  atmosphereStrength?: number
  /** Optional ring system (Saturn). */
  rings?: PlanetRingsConfig
  /**
   * Moons orbit *this* planet. They use the same Planet component recursively
   * — their `orbitRadius` is interpreted relative to the parent planet, not
   * the star. Lighting still comes from the world origin (the star), so they
   * receive correct day/night shading regardless of where the parent is.
   */
  moons?: PlanetProps[]
  /**
   * Optional identifier for click-boost participation. When set, this planet
   * registers as a boostable element; on tap, it may be chosen and gets a
   * brief (~1.5s) luminosity bump.
   */
  boostId?: string
}

const PLANET_VERT = /* glsl */`
  varying vec3 vLocalNormal;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  varying vec3 vViewDir;
  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    vWorldNormal   = normalize(mat3(modelMatrix) * normal);
    vLocalNormal   = normalize(normal);
    vViewDir       = normalize(cameraPosition - vWorldPosition);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`

const NOISE_GLSL = /* glsl */`
  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float noise(vec3 x) {
    vec3 i = floor(x); vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i+vec3(0,0,0)),hash(i+vec3(1,0,0)),f.x),
          mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x), f.y),
      mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),
          mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x), f.y),
      f.z);
  }
  float fbm(vec3 x) {
    float v = 0.0; float a = 0.5;
    for (int i = 0; i < 9; i++) { v += a * noise(x); x *= 2.0; a *= 0.5; }
    return v;
  }
`

const PLANET_FRAG = /* glsl */`
  uniform vec3 uStarPos;
  uniform float uTime;
  uniform float uPlanetType;   // 0 = rocky, 1 = gas
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;
  uniform vec3 uColorD;
  uniform float uNoiseScale;
  uniform float uShowIce;
  uniform float uCloudCoverage;
  uniform float uCraters;
  uniform float uHasSpot;
  uniform float uBandContrast;
  // Ring-shadow uniforms — only used when uHasRingShadow > 0.5
  uniform float uHasRingShadow;
  uniform vec3  uPlanetCenter;       // planet's world position
  uniform vec3  uPlanetAxis;         // planet's world-space rotation axis (tilted)
  uniform float uRingInnerWorld;     // ring inner radius in world units
  uniform float uRingOuterWorld;     // ring outer radius in world units
  // Click-boost: brief multiplicative bump applied to the final color.
  // Driven by clickBoost.ts via useFrame when this planet is the chosen
  // tap target; otherwise 0 (no-op).
  uniform float uBoost;
  varying vec3 vLocalNormal;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  varying vec3 vViewDir;

  ${NOISE_GLSL}

  void main() {
    vec3 p = vLocalNormal * uNoiseScale;
    vec3 surface;

    if (uPlanetType < 0.5) {
      // ROCKY — FBM elevation, threshold-mapped palette
      float h = fbm(p);

      // base surface from threshold ramp
      surface = mix(uColorA, mix(uColorA, uColorB, 0.5), smoothstep(0.42, 0.50, h));
      surface = mix(surface, uColorB, smoothstep(0.50, 0.58, h));
      surface = mix(surface, uColorC, smoothstep(0.62, 0.80, h));

      // polar ice
      if (uShowIce > 0.5) {
        float latitude = abs(vLocalNormal.y);
        float iceMask = smoothstep(0.80, 0.93, latitude);
        surface = mix(surface, uColorD, iceMask);
      }

      // craters (Mercury-style) — high-frequency dark patches
      if (uCraters > 0.5) {
        float craterNoise = fbm(p * 6.0);
        float craterMask = smoothstep(0.40, 0.28, craterNoise);
        surface = mix(surface, surface * 0.45, craterMask);
      }

      // drifting cloud layer
      if (uCloudCoverage > 0.0) {
        float clouds = fbm(p * 1.7 + vec3(uTime * 0.012, uTime * 0.008, -uTime * 0.010));
        float cloudMask = smoothstep(0.56, 0.72, clouds);
        surface = mix(surface, vec3(0.96, 0.97, 0.98), cloudMask * uCloudCoverage);
      }
    } else {
      // GAS GIANT — high-detail, multi-stage shading. In order:
      //   1. Domain warping: pre-distort the sample position so bands and
      //      storm noise patterns swirl like real fluid dynamics rather
      //      than statistically uniform turbulence.
      //   2. Four-frequency band stack on a wobbled latitude (the two
      //      turbulence amplitudes shift the band centerline left/right).
      //   3. Three-stop A→B→C palette traversal for dark-belt / light-zone.
      //   4. Storm spots layered: broad turbulent darkening + small bright
      //      cyclonic cloud tops + (Jupiter-only) Great Red Spot AND
      //      Oval BA (the smaller paler red oval).
      //   5. Pseudo-bump shading: brightness perturbation from a separate
      //      noise field, reads as surface depth without true normal maps.
      float lat = vLocalNormal.y;
      float absLat = abs(lat);

      // 1. Domain warp — three orthogonal noise samples become the warp vector
      vec3 warpVec = vec3(
        fbm(p * 0.7),
        fbm(p * 0.7 + vec3(13.7, 5.3, 19.1)),
        fbm(p * 0.7 + vec3(7.1, 11.3, 23.7))
      );
      vec3 warped = p + (warpVec - vec3(0.5)) * 0.65;

      // 2. Wobbled latitude — bigger turbulence amplitudes than before
      float bigTurb  = fbm(warped * 1.0 + vec3(uTime * 0.012, 0.0, uTime * 0.008));
      float fineTurb = fbm(warped * 3.5 + vec3(uTime * 0.020, 0.0, uTime * 0.014));
      float wobLat = lat + (bigTurb - 0.5) * 0.24 + (fineTurb - 0.5) * 0.08;

      // four-frequency band stack — major belts to micro-striations
      float coarse    = sin(wobLat * 12.0);
      float medium    = sin(wobLat * 42.0) * 0.32;
      float fine      = sin(wobLat * 130.0) * 0.14;
      float ultraFine = sin(wobLat * 300.0) * 0.05;
      // band contrast scales the variation; lower = subtler bands (Saturn)
      float bandVal = (coarse + medium + fine + ultraFine) * 0.42 * uBandContrast + 0.5;
      bandVal = clamp(bandVal, 0.0, 1.0);

      // 3. Palette traversal
      if (bandVal < 0.5) surface = mix(uColorA, uColorB, bandVal * 2.0);
      else               surface = mix(uColorB, uColorC, (bandVal - 0.5) * 2.0);

      // polar darkening
      surface = mix(surface, uColorD, smoothstep(0.78, 0.96, absLat) * 0.55);

      // 4a. broad turbulent storm patches (darkening from belt-edge upwell)
      float stormNoise = fbm(warped * 2.4 + vec3(uTime * 0.008, 0.0, uTime * 0.005));
      float stormMask = smoothstep(0.66, 0.78, stormNoise);
      surface = mix(surface, uColorA, stormMask * 0.45);

      // 4b. small bright cyclonic cloud tops
      float cycloneNoise = fbm(warped * 6.0 + vec3(uTime * 0.005, 0.0, 0.0));
      float cycloneMask = smoothstep(0.74, 0.82, cycloneNoise);
      surface = mix(surface, vec3(0.95, 0.92, 0.85), cycloneMask * 0.45);

      if (uHasSpot > 0.5) {
        float lon = atan(vLocalNormal.z, vLocalNormal.x) / (2.0 * 3.14159265) + 0.5;
        float latNorm = asin(clamp(vLocalNormal.y, -1.0, 1.0)) / 3.14159265 + 0.5;

        // Great Red Spot — large oval with halo/body/eye + spiral
        {
          float dx = abs(lon - 0.30);
          dx = min(dx, 1.0 - dx);
          float dy = (latNorm - 0.32);
          float spotR = sqrt(dx * dx * 1.4 + dy * dy * 4.5);

          float halo = smoothstep(0.150, 0.115, spotR);
          float body = smoothstep(0.110, 0.050, spotR);
          float eye  = smoothstep(0.045, 0.012, spotR);
          float spotAng = atan(dy, dx);
          float spiral = sin(spotAng * 2.5 + spotR * 28.0 + uTime * 0.06) * 0.5 + 0.5;
          float spotNoise = fbm(vLocalNormal * 14.0);

          surface = mix(surface, vec3(0.46, 0.20, 0.10), halo * 0.50);
          surface = mix(surface, vec3(0.78, 0.34, 0.18),
                       body * (0.78 + 0.18 * spiral) * (0.85 + 0.20 * spotNoise));
          surface = mix(surface, vec3(0.94, 0.58, 0.30), eye * 0.82);
        }

        // Oval BA — smaller paler red oval at different longitude
        {
          float dx = abs(lon - 0.65);
          dx = min(dx, 1.0 - dx);
          float dy = (latNorm - 0.36);
          float spotR = sqrt(dx * dx * 1.8 + dy * dy * 5.0);

          float halo = smoothstep(0.070, 0.050, spotR);
          float body = smoothstep(0.050, 0.018, spotR);
          float spotAng = atan(dy, dx);
          float swirl = sin(spotAng * 3.0 + spotR * 42.0 + uTime * 0.10) * 0.5 + 0.5;

          surface = mix(surface, vec3(0.55, 0.30, 0.20), halo * 0.35);
          surface = mix(surface, vec3(0.82, 0.55, 0.40), body * (0.70 + 0.20 * swirl));
        }
      }

      // 5. Pseudo-bump shading — surface noise modulates brightness
      // to read as elevation depth without real normal mapping.
      float bumpField = fbm(warped * 5.0 + vec3(0.0, uTime * 0.004, 0.0));
      surface *= 1.0 + (bumpField - 0.5) * 0.18;
    }

    // day/night lighting
    vec3 lightDir = normalize(uStarPos - vWorldPosition);
    float diffuseRaw = dot(vWorldNormal, lightDir);
    float lightFactor = smoothstep(-0.15, 0.30, diffuseRaw);

    vec3 nightTint = vec3(0.018, 0.022, 0.040);
    // Ring shadow (Saturn) — ray-plane intersection in world space.
    // Cast a ray from the surface point toward the sun (at origin); if it
    // crosses the equatorial plane within the ring radii, this point is
    // shadowed by the rings. ONLY apply on the day side (diffuseRaw > 0)
    // — on the night side the planet's own body blocks the sun, so the
    // ring shadow is moot and applying it just causes wrong-looking
    // darkening on back-facing surface points.
    if (uHasRingShadow > 0.5 && diffuseRaw > 0.0) {
      vec3 toSunDir = normalize(-vWorldPosition);  // sun is at world origin
      float denom = dot(toSunDir, uPlanetAxis);
      if (abs(denom) > 0.0015) {
        float t = -dot(vWorldPosition - uPlanetCenter, uPlanetAxis) / denom;
        if (t > 0.0) {
          vec3 hit = vWorldPosition + toSunDir * t;
          float hitR = length(hit - uPlanetCenter);
          if (hitR > uRingInnerWorld && hitR < uRingOuterWorld) {
            float edgeSoft =
              smoothstep(uRingInnerWorld, uRingInnerWorld + 0.04, hitR) *
              smoothstep(uRingOuterWorld + 0.04, uRingOuterWorld, hitR);
            surface *= 1.0 - 0.55 * edgeSoft;
          }
        }
      }
    }

    vec3 finalColor = surface * (lightFactor * 0.95 + 0.10)
                    + nightTint * (1.0 - lightFactor);

    // Click-boost: brief multiplicative bump to luminosity. 0 when idle.
    // Driven from JS via the clickBoost registry; written into the live
    // material's uniforms each frame in useFrame below.
    finalColor *= (1.0 + uBoost);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`

const ATMO_FRAG = /* glsl */`
  uniform vec3 uStarPos;
  uniform vec3 uColor;
  uniform float uStrength;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  varying vec3 vViewDir;

  void main() {
    float fresnel = 1.0 - max(0.0, dot(vWorldNormal, vViewDir));
    // wider falloff (pow 1.8 vs 2.4) → atmosphere extends further from the limb
    fresnel = pow(fresnel, 1.8);
    vec3 lightDir = normalize(uStarPos - vWorldPosition);
    float dayFactor = smoothstep(-0.25, 0.45, dot(vWorldNormal, lightDir));
    float alpha = fresnel * dayFactor * 0.95 * uStrength;
    vec3 col = uColor * alpha * 2.4;  // brighter color contribution
    gl_FragColor = vec4(col, alpha);
  }
`

const RING_VERT = /* glsl */`
  varying vec2 vLocalXY;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  void main() {
    vLocalXY = position.xy;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    vWorldNormal   = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`

const RING_FRAG = /* glsl */`
  uniform vec3 uColor;
  uniform vec3 uStarPos;
  uniform float uInner;
  uniform float uOuter;
  uniform float uBandCount;
  uniform float uOpacity;
  varying vec2 vLocalXY;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  ${NOISE_GLSL}

  void main() {
    float r = length(vLocalXY);
    if (r < uInner || r > uOuter) discard;

    float ringT = (r - uInner) / (uOuter - uInner);

    // ANTIALIASING: fwidth() returns the screen-space derivative of ringT
    // — how much it changes between adjacent pixels. When bands become
    // smaller than a pixel they alias. Fade band variation toward 1.0
    // (full bright) when aliased — antialiased rings render as a smooth
    // bright disc instead of dim haze.
    float ringTDeriv = fwidth(ringT);
    float bandPeriod = 1.0 / uBandCount;
    float aaFade = smoothstep(bandPeriod * 1.5, bandPeriod * 6.0, ringTDeriv);

    float bands = sin(ringT * uBandCount * 3.14159 * 2.0) * 0.5 + 0.5;
    bands *= sin(ringT * uBandCount * 0.43 * 3.14159 * 2.0 + 0.5) * 0.4 + 0.6;
    bands = mix(bands, 1.0, aaFade);

    // Cassini Division
    float cassiniEdge = max(fwidth(ringT), 0.001);
    float cassini = smoothstep(0.42 - cassiniEdge, 0.45, ringT) *
                    smoothstep(0.50 + cassiniEdge, 0.47, ringT);
    float gap = cassini * 0.85;

    float edgeFade = smoothstep(0.0, 0.05, ringT) * smoothstep(1.0, 0.92, ringT);

    float alpha = bands * (1.0 - gap) * edgeFade * uOpacity;

    // Brighter base — rings should be visibly luminous against the dark sky.
    // Using a higher floor on diffuse (0.55 vs 0.35) and a brighter color
    // multiplier (1.4×) so they stand out at any viewing angle.
    vec3 lightDir = normalize(uStarPos - vWorldPosition);
    float diffuse = abs(dot(vWorldNormal, lightDir));
    diffuse = 0.55 + diffuse * 0.55;

    vec3 col = uColor * diffuse * 1.4;
    gl_FragColor = vec4(col, alpha);
  }
`

export function Planet({
  orbitRadius = 4.5,
  orbitPeriod = 90,
  initialOrbitAngle = 0,
  planetRadius = 0.25,
  axialTilt = 0.41,
  rotationPeriod = 14,
  planetType = 'rocky',
  colorA = '#1a3a6a',
  colorB = '#3a7050',
  colorC = '#7a5a40',
  colorD = '#f0f5f8',
  noiseScale = 2.6,
  showIce = true,
  cloudCoverage = 0.5,
  craters = false,
  hasRedSpot = false,
  bandContrast = 1.0,
  atmosphereColor = '#6090ff',
  atmosphereStrength = 0.8,
  rings,
  moons,
  boostId,
}: PlanetProps) {
  const orbitRef = useRef<THREE.Group>(null)
  const planetRef = useRef<THREE.Mesh>(null)
  const angleRef = useRef(initialOrbitAngle)

  useEffect(() => {
    if (!boostId) return
    return registerBoostable(boostId)
  }, [boostId])
  const spinRef = useRef(0)

  const starPos = useMemo(() => new THREE.Vector3(0, 0, 0), [])

  // Pre-compute the planet's world-space rotation axis from the axial tilt.
  // The tilt rotates the (0,1,0) axis around X, so the axis points in the
  // +Y/+Z plane. This stays constant in world space as the planet orbits.
  const planetAxis = useMemo(
    () => new THREE.Vector3(0, Math.cos(axialTilt), Math.sin(axialTilt)).normalize(),
    [axialTilt],
  )

  const planetUniforms = useMemo(() => ({
    uStarPos:           { value: starPos },
    uTime:              { value: 0 },
    uPlanetType:        { value: planetType === 'gas' ? 1 : 0 },
    uColorA:            { value: new THREE.Color(colorA) },
    uColorB:            { value: new THREE.Color(colorB) },
    uColorC:            { value: new THREE.Color(colorC) },
    uColorD:            { value: new THREE.Color(colorD) },
    uNoiseScale:        { value: noiseScale },
    uShowIce:           { value: showIce ? 1 : 0 },
    uCloudCoverage:     { value: cloudCoverage },
    uCraters:           { value: craters ? 1 : 0 },
    uHasSpot:           { value: hasRedSpot ? 1 : 0 },
    uBandContrast:      { value: bandContrast },
    uHasRingShadow:     { value: rings ? 1 : 0 },
    uPlanetCenter:      { value: new THREE.Vector3(0, 0, 0) },  // updated each frame
    uPlanetAxis:        { value: planetAxis },
    uRingInnerWorld:    { value: rings ? rings.innerRadius * planetRadius : 0 },
    uRingOuterWorld:    { value: rings ? rings.outerRadius * planetRadius : 0 },
    uBoost:             { value: 0 },
  }), [starPos, planetType, colorA, colorB, colorC, colorD, noiseScale, showIce, cloudCoverage, craters, hasRedSpot, bandContrast, rings, planetRadius, planetAxis])

  const atmoUniforms = useMemo(() => ({
    uStarPos:   { value: starPos },
    uColor:     { value: new THREE.Color(atmosphereColor) },
    uStrength:  { value: atmosphereStrength },
  }), [starPos, atmosphereColor, atmosphereStrength])

  const ringUniforms = useMemo(() => rings ? {
    uColor:     { value: new THREE.Color(rings.color) },
    uStarPos:   { value: starPos },
    uInner:     { value: rings.innerRadius * planetRadius },
    uOuter:     { value: rings.outerRadius * planetRadius },
    uBandCount: { value: rings.bandCount ?? 18 },
    uOpacity:   { value: rings.opacity ?? 0.85 },
  } : null, [rings, starPos, planetRadius])

  useFrame((_, delta) => {
    angleRef.current += (Math.PI * 2 / orbitPeriod) * delta
    spinRef.current  += (Math.PI * 2 / rotationPeriod) * delta
    planetUniforms.uTime.value += delta

    if (orbitRef.current) {
      orbitRef.current.position.x = Math.cos(angleRef.current) * orbitRadius
      orbitRef.current.position.z = Math.sin(angleRef.current) * orbitRadius
      // Push the planet's world position into the shader so the ring shadow
      // can do its world-space ray-plane intersection. (Skipped if no rings.)
      if (rings) {
        planetUniforms.uPlanetCenter.value.copy(orbitRef.current.position)
      }
    }
    if (planetRef.current) {
      planetRef.current.rotation.y = spinRef.current
    }
    // Click-boost: 0 when idle, brief positive bump when this planet is
    // the chosen tap target. Wall-clock seconds (NOT clock.elapsedTime
    // — that's canvas-scoped and would never match fireRandomBoost's
    // start time). Shader multiplies final color by (1 + uBoost).
    //
    // IMPORTANT: write to the LIVE material's uniforms, not the React
    // useMemo'd `planetUniforms` object. R3F/Three.js clones the uniforms
    // when constructing the ShaderMaterial, so the GPU-bound copy lives
    // at material.uniforms.uBoost — writing only to planetUniforms is a
    // dead write the GPU never sees.
    const boostValue = boostId ? getBoost(boostId, nowSeconds()) : 0
    planetUniforms.uBoost.value = boostValue
    const liveMat = planetRef.current?.material as THREE.ShaderMaterial | undefined
    if (liveMat?.uniforms?.uBoost) liveMat.uniforms.uBoost.value = boostValue
  })

  return (
    <group ref={orbitRef}>
      <group rotation={[axialTilt, 0, 0]}>
        {/* planet surface */}
        <mesh ref={planetRef}>
          <sphereGeometry args={[planetRadius, 64, 64]} />
          <shaderMaterial
            vertexShader={PLANET_VERT}
            fragmentShader={PLANET_FRAG}
            uniforms={planetUniforms}
          />
        </mesh>

        {/* atmosphere */}
        {atmosphereStrength > 0 && (
          <mesh>
            <sphereGeometry args={[planetRadius * 1.12, 48, 48]} />
            <shaderMaterial
              vertexShader={PLANET_VERT}
              fragmentShader={ATMO_FRAG}
              uniforms={atmoUniforms}
              blending={THREE.AdditiveBlending}
              transparent
              depthWrite={false}
              side={THREE.BackSide}
            />
          </mesh>
        )}

        {/* rings — flat in the planet's equatorial plane (XZ in tilted frame).
            renderOrder=2 ensures rings draw on top of the planet body and
            atmosphere when they overlap. */}
        {rings && ringUniforms && (
          <mesh rotation={[Math.PI / 2, 0, 0]} renderOrder={2}>
            <ringGeometry args={[
              rings.innerRadius * planetRadius,
              rings.outerRadius * planetRadius,
              128,
              4,
            ]} />
            <shaderMaterial
              vertexShader={RING_VERT}
              fragmentShader={RING_FRAG}
              uniforms={ringUniforms}
              transparent
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
        )}
      </group>

      {/* Moons — rendered OUTSIDE the planet's tilt group so they orbit in
          the planet's local orbital plane rather than its tilted equatorial
          plane. Each is a recursive Planet with its own params. */}
      {moons?.map((m, i) => <Planet key={`moon-${i}`} {...m} />)}
    </group>
  )
}
