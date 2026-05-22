import { useMemo } from 'react'
import * as THREE from 'three'
import { discTexture } from './discTexture'

// Distant Milky Way band — the galactic plane seen from inside our solar
// system. Tilted ~60° off the ecliptic, cuts diagonally across the sky.
//
// Three layers + dust modulation:
//   1. Dense star pinpricks (resolved stars in the disc)
//   2. Bright knots (cluster spots / unresolved-but-prominent regions)
//   3. Soft diffuse glow (the milky-white unresolved-stars haze)
//
// All three layers' per-particle brightness is modulated by a dust-noise
// function so the band has visible dark patches (dust lanes) rather than
// uniform density. Centerline of the band wobbles via two sine waves of
// longitude — gives the band a gentle wavy shape rather than a straight
// line, matching photos of the real Milky Way. Width is wider near the
// galactic center direction and tapers off at the edges.

const RADIUS = 240
// Full 360° band — we sit inside the galactic disc, so the Milky Way wraps
// the entire sky as a continuous belt. Any longitudinal function in here
// (centerline curve, dust noise) must be periodic over [-1, 1] in lonNorm
// or you get a visible seam at the wrap point.
const LON_SPAN = Math.PI * 2
const LAT_THICKNESS = 0.14         // base thickness in radians (≈ 8°)
const TILT = 0.95

const STAR_COUNT = 9500
const KNOT_COUNT = 1400
const GLOW_COUNT = 3500

interface Sample {
  x: number; y: number; z: number
  t: number       // longitude normalized [-1, 1]
  latFrac: number // signed latitude within the band thickness
}

// Dust-lane modulation — multi-frequency wiggly function across the band.
// Returns a brightness multiplier in [≈0.30, 1.10]. High dust = darker patches.
// All lon-dependent frequencies are INTEGER multiples of 2π so the dust
// pattern wraps seamlessly at the full-ring seam.
function dustFactor(lonNorm: number, latFrac: number): number {
  const lon2pi = lonNorm * Math.PI * 2
  const a = Math.sin(lon2pi *  4.0 + latFrac * 3.1) *
            Math.cos(latFrac *  6.0 + lon2pi * 2.0)
  const b = Math.sin(lon2pi *  7.0 + 1.3) * 0.55
  const c = Math.sin(lon2pi *  3.0 - latFrac * 7.1) * 0.40
  const d = Math.cos(lon2pi * 11.0 + latFrac * 2.7) * 0.25
  const noise = (a + b + c + d) / 2.4  // ≈[-1, 1]
  return Math.max(0.20, 1.0 - Math.max(0, noise) * 0.65 + Math.max(0, -noise) * 0.12)
}

function pickPointOnBand(): Sample {
  const u = Math.random() * 2 - 1
  const lonNorm = Math.sign(u) * Math.pow(Math.abs(u), 0.65)

  // Wavy centerline — two sine waves at INTEGER multiples of 2π so the
  // curve wraps seamlessly around the full ring (no seam at lonNorm ±1).
  const centerLat =
    (Math.sin(lonNorm * Math.PI * 2.0) * 1.6 +
     Math.sin(lonNorm * Math.PI * 6.0) * 0.45) * LAT_THICKNESS * 0.55

  // Width modulation — band is wider near galactic center direction
  const centerBoost = Math.exp(-Math.pow(lonNorm * 1.4, 2))
  const widthMul = 0.30 + centerBoost * 1.20

  // Gaussian latitudinal scatter
  const u1 = Math.max(Math.random(), 1e-6)
  const u2 = Math.random()
  const g = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  const latFracRaw = Math.max(-1.4, Math.min(1.4, g * 0.5))

  const lon = lonNorm * (LON_SPAN * 0.5)
  const lat = centerLat + latFracRaw * LAT_THICKNESS * widthMul

  // map to unit sphere direction
  let x = Math.cos(lon) * Math.cos(lat)
  let y = Math.sin(lat)
  const z = Math.sin(lon) * Math.cos(lat)

  // tilt the whole band diagonally across the sky
  const cosT = Math.cos(TILT)
  const sinT = Math.sin(TILT)
  const rx = x * cosT - y * sinT
  const ry = x * sinT + y * cosT
  x = rx
  y = ry

  return {
    x: x * RADIUS,
    y: y * RADIUS,
    z: z * RADIUS,
    t: lonNorm,
    latFrac: latFracRaw,
  }
}

export function MilkyWayBand() {
  const texture = useMemo(() => discTexture(), [])

  // Layer 1: dense pinpricks
  const stars = useMemo(() => {
    const positions = new Float32Array(STAR_COUNT * 3)
    const colors = new Float32Array(STAR_COUNT * 3)
    const color = new THREE.Color()
    const warm    = new THREE.Color('#ffd49a')
    const peach   = new THREE.Color('#f0b888')
    const neutral = new THREE.Color('#d0c8b8')
    const cool    = new THREE.Color('#88a0c8')
    const violet  = new THREE.Color('#7060a8')
    const pink    = new THREE.Color('#c878a8')

    for (let i = 0; i < STAR_COUNT; i++) {
      const s = pickPointOnBand()
      positions[i * 3]     = s.x
      positions[i * 3 + 1] = s.y
      positions[i * 3 + 2] = s.z

      const at = Math.abs(s.t)
      if (at < 0.35)      color.copy(warm).lerp(peach, at / 0.35)
      else if (at < 0.60) color.copy(peach).lerp(neutral, (at - 0.35) / 0.25)
      else                color.copy(neutral).lerp(cool, (at - 0.60) / 0.40)

      const accentRoll = Math.random()
      if (accentRoll < 0.06)      color.lerp(violet, 0.65)
      else if (accentRoll < 0.10) color.lerp(pink, 0.55)

      const centerBoost = Math.exp(-Math.pow(s.t * 1.2, 2))
      const dust = dustFactor(s.t, s.latFrac)
      const variance = Math.pow(Math.random(), 1.5)
      const brightness = (0.32 + centerBoost * 0.55) * dust * (0.45 + 0.55 * variance)

      colors[i * 3]     = color.r * brightness
      colors[i * 3 + 1] = color.g * brightness
      colors[i * 3 + 2] = color.b * brightness
    }
    return { positions, colors }
  }, [])

  // Layer 2: bright knots — sparser, larger, brighter spots (cluster regions)
  const knots = useMemo(() => {
    const positions = new Float32Array(KNOT_COUNT * 3)
    const colors = new Float32Array(KNOT_COUNT * 3)
    const color = new THREE.Color()
    const palette = [
      new THREE.Color('#fff0c8'),
      new THREE.Color('#ffd498'),
      new THREE.Color('#e0a8a0'),
      new THREE.Color('#b0a8d0'),
      new THREE.Color('#a8c4e0'),
    ]

    for (let i = 0; i < KNOT_COUNT; i++) {
      const s = pickPointOnBand()
      positions[i * 3]     = s.x
      positions[i * 3 + 1] = s.y
      positions[i * 3 + 2] = s.z

      color.copy(palette[Math.floor(Math.random() * palette.length)])
      const centerBoost = Math.exp(-Math.pow(s.t * 1.0, 2))
      const dust = dustFactor(s.t, s.latFrac)
      // knots brighter than regular stars but still dust-modulated
      const brightness = (0.55 + centerBoost * 0.60) * dust * (0.6 + 0.4 * Math.random())

      colors[i * 3]     = color.r * brightness
      colors[i * 3 + 1] = color.g * brightness
      colors[i * 3 + 2] = color.b * brightness
    }
    return { positions, colors }
  }, [])

  // Layer 3: diffuse glow underneath
  const glow = useMemo(() => {
    const positions = new Float32Array(GLOW_COUNT * 3)
    const colors = new Float32Array(GLOW_COUNT * 3)
    const color = new THREE.Color()
    const glowWarm   = new THREE.Color('#b89870')
    const glowMid    = new THREE.Color('#7080a0')
    const glowCool   = new THREE.Color('#5870a0')
    const glowViolet = new THREE.Color('#604888')

    for (let i = 0; i < GLOW_COUNT; i++) {
      const s = pickPointOnBand()
      positions[i * 3]     = s.x
      positions[i * 3 + 1] = s.y
      positions[i * 3 + 2] = s.z

      const at = Math.abs(s.t)
      if (at < 0.40)      color.copy(glowWarm).lerp(glowMid, at / 0.40)
      else if (at < 0.75) color.copy(glowMid).lerp(glowCool, (at - 0.40) / 0.35)
      else                color.copy(glowCool).lerp(glowViolet, (at - 0.75) / 0.25)

      if (Math.random() < 0.15) color.lerp(glowViolet, 0.4)

      const centerBoost = Math.exp(-Math.pow(s.t * 1.2, 2))
      const dust = dustFactor(s.t, s.latFrac)
      const brightness = (0.22 + centerBoost * 0.40) * dust

      colors[i * 3]     = color.r * brightness
      colors[i * 3 + 1] = color.g * brightness
      colors[i * 3 + 2] = color.b * brightness
    }
    return { positions, colors }
  }, [])

  return (
    <group>
      {/* diffuse glow */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[glow.positions, 3]} />
          <bufferAttribute attach="attributes-color"    args={[glow.colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={9}
          sizeAttenuation={false}
          vertexColors
          map={texture}
          alphaMap={texture}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          transparent
          opacity={0.40}
        />
      </points>

      {/* bright knots — cluster regions */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[knots.positions, 3]} />
          <bufferAttribute attach="attributes-color"    args={[knots.colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={2.5}
          sizeAttenuation={false}
          vertexColors
          map={texture}
          alphaMap={texture}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          transparent
          opacity={0.85}
        />
      </points>

      {/* dense pinpricks on top */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[stars.positions, 3]} />
          <bufferAttribute attach="attributes-color"    args={[stars.colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={1.1}
          sizeAttenuation={false}
          vertexColors
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          transparent
          opacity={0.95}
        />
      </points>
    </group>
  )
}
