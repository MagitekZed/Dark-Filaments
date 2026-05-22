import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { discTexture, sparkTexture } from './discTexture'
import { GALAXY_SPIN_RATE } from '../sceneParams'

// =============================================================
// Shape generators — each population's spatial distribution.
// =============================================================

type Sample = { x: number; y: number; z: number; t: number }
type Gen = () => Sample

// (§6.3 cleanup) Removed the unused `sgn` helper — it had no consumer and
// `noUnusedLocals` flags it. The galaxy generators use Math.sign / explicit
// signed expressions directly.
const pow = Math.pow

// Cheap deterministic-ish "noise" — layered sines. Smooth wiggle, no library needed.
function noise1(x: number, seed: number): number {
  return (
    Math.sin(x * 1.7 + seed) * 0.55 +
    Math.sin(x * 3.3 + seed * 2.13) * 0.30 +
    Math.sin(x * 7.1 + seed * 0.71) * 0.15
  )
}

// Box-Muller-ish standard-normal sample, clamped to ±3σ.
function gauss(): number {
  const u1 = Math.max(Math.random(), 1e-6)
  const u2 = Math.random()
  const g = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  return Math.max(-3, Math.min(3, g))
}

// Centrally-concentrated flattened bulge.
function bulgeGen(radius: number, flatten: number): Gen {
  return () => {
    const r = pow(Math.random(), 2.4) * radius
    const phi = Math.random() * Math.PI * 2
    const cosTh = (Math.random() * 2 - 1)
    const sinTh = Math.sqrt(1 - cosTh * cosTh)
    return {
      x: r * sinTh * Math.cos(phi),
      y: r * cosTh * flatten,
      z: r * sinTh * Math.sin(phi),
      t: r / radius,
    }
  }
}

// Elongated bar through the center — anisotropic ellipsoid along x.
function barGen(length: number, thickness: number, height: number): Gen {
  return () => {
    // density peaks at center, falls off toward bar tips
    const u = (Math.random() * 2 - 1)
    const x = Math.sign(u) * pow(Math.abs(u), 0.7) * length
    const z = (Math.random() * 2 - 1) * thickness * pow(Math.random(), 0.5)
    const y = (Math.random() * 2 - 1) * height * pow(Math.random(), 0.7)
    return { x, y, z, t: Math.abs(x) / length }
  }
}

// Uniform-area disc, dim filler population.
function discGen(radiusMin: number, radiusMax: number, flatten: number): Gen {
  return () => {
    const r = Math.sqrt(
      radiusMin * radiusMin +
      Math.random() * (radiusMax * radiusMax - radiusMin * radiusMin)
    )
    const phi = Math.random() * Math.PI * 2
    const y = (Math.random() * 2 - 1) * flatten * pow(Math.random(), 1.2)
    return {
      x: r * Math.cos(phi),
      y,
      z: r * Math.sin(phi),
      t: (r - radiusMin) / (radiusMax - radiusMin),
    }
  }
}

// Organic spiral-arm generator.
// - particles distributed as a Gaussian-ish BAND around the spiral curve
// - band width modulated along arm length (arm fattens and thins)
// - particle density modulated along arm length (rejection sampling → clumps + gaps)
function armGen(args: {
  branchIdx: number
  branchCount: number
  rStart: number
  rMax: number
  spin: number
  spinBias: number
  baseWidth: number       // fraction of r used as 1σ cross-arm spread
  widthNoiseAmp: number   // 0..1 modulation of width along arm
  densityNoiseAmp: number // 0..1 modulation of accept-probability
  noiseFreq: number       // how fast modulations wiggle along r
  yScatter: number
  phaseJitter: number
  tBias: number           // pow exponent on tRaw; 1 = uniform along arm
  widthSeed: number
  densitySeed: number
}): Gen {
  const {
    branchIdx, branchCount, rStart, rMax,
    spin, spinBias, baseWidth,
    widthNoiseAmp, densityNoiseAmp, noiseFreq,
    yScatter, phaseJitter, tBias,
    widthSeed, densitySeed,
  } = args
  const baseAngle = (branchIdx / branchCount) * Math.PI * 2
  return () => {
    for (let attempt = 0; attempt < 6; attempt++) {
      const tRaw = pow(Math.random(), tBias)
      const r = rStart + tRaw * (rMax - rStart)

      // density mask — rejection sampling produces clumps and gaps
      const dn = noise1(r * noiseFreq, densitySeed)
      const accept = 0.55 + dn * densityNoiseAmp
      if (Math.random() > accept) continue

      // arm centerline angle
      const spinAngle = (r - rStart) * (spin + spinBias)
      const phase = baseAngle + spinAngle + (Math.random() - 0.5) * phaseJitter

      // width modulation along arm
      const wn = noise1(r * noiseFreq * 0.7, widthSeed)
      const width = baseWidth * r * (1.0 + wn * widthNoiseAmp)

      // perpendicular (cross-arm) Gaussian + small tangential jitter
      const perp = gauss() * width * 0.5
      const tang = (Math.random() - 0.5) * width * 0.25

      const cosP = Math.cos(phase), sinP = Math.sin(phase)
      // radial outward = (cosP, sinP); along-arm tangent = (-sinP, cosP)
      const x = cosP * r + cosP * perp - sinP * tang
      const z = sinP * r + sinP * perp + cosP * tang
      const y = gauss() * width * yScatter * 0.4
      return { x, y, z, t: tRaw }
    }
    const r = (rStart + rMax) * 0.5
    return { x: r, y: 0, z: 0, t: 0.5 }
  }
}

// Discrete clusters placed at noise-modulated positions along an arm.
// Each cluster scatters `perCluster` particles around its center.
function armClustersGen(args: {
  branchIdx: number
  branchCount: number
  rStart: number
  rMax: number
  spin: number
  spinBias: number
  numClusters: number
  perCluster: number
  spread: number
  yScatter: number
  phaseJitter: number
}): Sample[] {
  const {
    branchIdx, branchCount, rStart, rMax,
    spin, spinBias, numClusters, perCluster,
    spread, yScatter, phaseJitter,
  } = args
  const baseAngle = (branchIdx / branchCount) * Math.PI * 2
  const out: Sample[] = []
  for (let c = 0; c < numClusters; c++) {
    // bias cluster placement toward mid-arm (where star formation peaks)
    const tRaw = 0.15 + pow(Math.random(), 1.2) * 0.78
    const r = rStart + tRaw * (rMax - rStart)
    const spinAngle = (r - rStart) * (spin + spinBias)
    const phase = baseAngle + spinAngle + (Math.random() - 0.5) * phaseJitter
    const cx = Math.cos(phase) * r
    const cz = Math.sin(phase) * r
    const csz = spread * (0.6 + Math.random() * 0.6) // per-cluster size variation
    for (let p = 0; p < perCluster; p++) {
      const dx = (Math.random() - 0.5) * csz * 2
      const dz = (Math.random() - 0.5) * csz * 2
      const dy = (Math.random() - 0.5) * csz * yScatter * 2
      out.push({ x: cx + dx, y: dy, z: cz + dz, t: tRaw })
    }
  }
  return out
}

// =============================================================
// Population builder — turn a generator into position+color buffers.
// =============================================================

function build(
  count: number,
  gen: Gen,
  innerColor: THREE.Color,
  outerColor: THREE.Color,
): { positions: Float32Array; colors: Float32Array } {
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const c = new THREE.Color()
  for (let i = 0; i < count; i++) {
    const s = gen()
    positions[i * 3]     = s.x
    positions[i * 3 + 1] = s.y
    positions[i * 3 + 2] = s.z
    c.copy(innerColor).lerp(outerColor, Math.min(s.t, 1))
    colors[i * 3]     = c.r
    colors[i * 3 + 1] = c.g
    colors[i * 3 + 2] = c.b
  }
  return { positions, colors }
}

function buildFromSamples(
  samples: Sample[],
  innerColor: THREE.Color,
  outerColor: THREE.Color,
): { positions: Float32Array; colors: Float32Array } {
  const count = samples.length
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const c = new THREE.Color()
  for (let i = 0; i < count; i++) {
    const s = samples[i]
    positions[i * 3]     = s.x
    positions[i * 3 + 1] = s.y
    positions[i * 3 + 2] = s.z
    c.copy(innerColor).lerp(outerColor, Math.min(s.t, 1))
    colors[i * 3]     = c.r
    colors[i * 3 + 1] = c.g
    colors[i * 3 + 2] = c.b
  }
  return { positions, colors }
}

// =============================================================
// The galaxy itself.
// =============================================================

const R_BAR = 1.6
const R_DISC = 5.5
const ARM_SPIN = 0.85

// Two arms emerging from the bar tips. Per-arm tweaks break symmetry —
// different spin, different clump/gap noise phase.
const ARM_PARAMS = [
  { branchIdx: 0, spinBias:  0.08, phaseJitter: 0.14, widthSeed: 1.3, densitySeed: 2.7 },
  { branchIdx: 1, spinBias: -0.05, phaseJitter: 0.10, widthSeed: 4.1, densitySeed: 5.6 },
]

export function Galaxy() {
  const spinRef = useRef<THREE.Group>(null)
  const soft = useMemo(() => discTexture(), [])
  const spark = useMemo(() => sparkTexture(), [])

  const bulge = useMemo(
    () => build(1200, bulgeGen(R_BAR * 0.65, 0.45),
      new THREE.Color('#fff5d4'),
      new THREE.Color('#d09060')),
    [],
  )

  const bar = useMemo(
    () => build(1400, barGen(R_BAR, 0.32, 0.18),
      new THREE.Color('#ffe9b0'),
      new THREE.Color('#c87038')),
    [],
  )

  const disc = useMemo(
    () => build(5000, discGen(R_BAR * 0.9, R_DISC, 0.20),
      new THREE.Color('#a07c54'),
      new THREE.Color('#26243c')),
    [],
  )

  const armGas = useMemo(() => {
    const samples: Sample[] = []
    for (const ap of ARM_PARAMS) {
      const gen = armGen({
        branchIdx: ap.branchIdx,
        branchCount: 2,
        rStart: R_BAR * 0.85,
        rMax: R_DISC,
        spin: ARM_SPIN,
        spinBias: ap.spinBias,
        baseWidth: 0.40,          // much wider band than arm stars
        widthNoiseAmp: 0.70,      // dramatic width variation
        densityNoiseAmp: 0.45,
        noiseFreq: 1.7,
        yScatter: 0.22,           // some vertical puffiness
        phaseJitter: ap.phaseJitter * 1.5,
        tBias: 1.0,
        widthSeed: ap.widthSeed + 100,
        densitySeed: ap.densitySeed + 100,
      })
      const perArm = 3500
      for (let i = 0; i < perArm; i++) samples.push(gen())
    }
    return buildFromSamples(samples,
      new THREE.Color('#7a8aa8'),
      new THREE.Color('#22203a'))
  }, [])

  const armStars = useMemo(() => {
    const samples: Sample[] = []
    for (const ap of ARM_PARAMS) {
      const gen = armGen({
        branchIdx: ap.branchIdx,
        branchCount: 2,
        rStart: R_BAR * 0.9,
        rMax: R_DISC,
        spin: ARM_SPIN,
        spinBias: ap.spinBias,
        baseWidth: 0.18,
        widthNoiseAmp: 0.55,
        densityNoiseAmp: 0.40,
        noiseFreq: 2.2,
        yScatter: 0.10,
        phaseJitter: ap.phaseJitter,
        tBias: 1.0,
        widthSeed: ap.widthSeed,
        densitySeed: ap.densitySeed,
      })
      const perArm = 6000
      for (let i = 0; i < perArm; i++) samples.push(gen())
    }
    return buildFromSamples(samples,
      new THREE.Color('#ffffff'),
      new THREE.Color('#b8d0ff'))
  }, [])

  const armClusters = useMemo(() => {
    const samples: Sample[] = []
    for (const ap of ARM_PARAMS) {
      samples.push(...armClustersGen({
        branchIdx: ap.branchIdx,
        branchCount: 2,
        rStart: R_BAR * 0.95,
        rMax: R_DISC * 0.95,
        spin: ARM_SPIN,
        spinBias: ap.spinBias,
        numClusters: 70,
        perCluster: 13,
        spread: 0.12,
        yScatter: 0.18,
        phaseJitter: ap.phaseJitter,
      }))
    }
    return buildFromSamples(samples,
      new THREE.Color('#d8e4ff'),
      new THREE.Color('#5080ff'))
  }, [])

  const armDust = useMemo(() => {
    const samples: Sample[] = []
    for (const ap of ARM_PARAMS) {
      const gen = armGen({
        branchIdx: ap.branchIdx,
        branchCount: 2,
        rStart: R_BAR * 0.95,
        rMax: R_DISC * 0.95,
        spin: ARM_SPIN,
        spinBias: ap.spinBias,
        baseWidth: 0.10,           // thin band
        widthNoiseAmp: 0.45,
        densityNoiseAmp: 0.50,     // somewhat continuous with some gaps
        noiseFreq: 2.8,            // finer-grained variation than gas
        yScatter: 0.05,            // very thin vertically
        phaseJitter: ap.phaseJitter * 0.4,
        tBias: 0.95,
        widthSeed: ap.widthSeed + 200,
        densitySeed: ap.densitySeed + 200,
      })
      const perArm = 3200
      for (let i = 0; i < perArm; i++) samples.push(gen())
    }
    // shift dust samples slightly inward — dust lanes sit on the inner
    // (leading) edge of spiral arms, not on the centerline
    const inwardShift = 0.12
    for (const s of samples) {
      const r = Math.sqrt(s.x * s.x + s.z * s.z)
      if (r > inwardShift) {
        const f = (r - inwardShift) / r
        s.x *= f
        s.z *= f
      }
    }
    return buildFromSamples(samples,
      new THREE.Color('#070406'),
      new THREE.Color('#0e0a08'))
  }, [])

  const hiiRegions = useMemo(() => {
    const samples: Sample[] = []
    for (const ap of ARM_PARAMS) {
      samples.push(...armClustersGen({
        branchIdx: ap.branchIdx,
        branchCount: 2,
        rStart: R_BAR * 1.05,
        rMax: R_DISC * 0.95,
        spin: ARM_SPIN,
        spinBias: ap.spinBias,
        numClusters: 32,
        perCluster: 4,
        spread: 0.22,
        yScatter: 0.30,
        phaseJitter: ap.phaseJitter,
      }))
    }
    return buildFromSamples(samples,
      new THREE.Color('#ff9bbf'),
      new THREE.Color('#ff4f8e'))
  }, [])

  useFrame((_, delta) => {
    // Disc spin — shared with TwinklingStars via sceneParams.GALAXY_SPIN_RATE
    // (NOTES.md coupling #1) so the embedded named stars track the disc.
    if (spinRef.current) spinRef.current.rotation.y += delta * GALAXY_SPIN_RATE
  })

  return (
    <group ref={spinRef}>
      {/* dim background disc — fills the bar-to-arm gap with faint stars */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[disc.positions, 3]} />
          <bufferAttribute attach="attributes-color"    args={[disc.colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.055}
          sizeAttenuation
          vertexColors
          map={soft}
          alphaMap={soft}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          transparent
          opacity={0.65}
        />
      </points>

      {/* bulge — soft warm glow at center */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[bulge.positions, 3]} />
          <bufferAttribute attach="attributes-color"    args={[bulge.colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.13}
          sizeAttenuation
          vertexColors
          map={soft}
          alphaMap={soft}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          transparent
          opacity={0.75}
        />
      </points>

      {/* bar — elongated bright structure through the center */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[bar.positions, 3]} />
          <bufferAttribute attach="attributes-color"    args={[bar.colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.07}
          sizeAttenuation
          vertexColors
          map={soft}
          alphaMap={soft}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          transparent
          opacity={0.95}
        />
      </points>

      {/* arm gas — diffuse nebular cloudiness hugging the arm centerlines */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[armGas.positions, 3]} />
          <bufferAttribute attach="attributes-color"    args={[armGas.colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.16}
          sizeAttenuation
          vertexColors
          map={soft}
          alphaMap={soft}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          transparent
          opacity={0.28}
        />
      </points>

      {/* arm stars — sharp pinpricks, white-blue, defines arm shape */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[armStars.positions, 3]} />
          <bufferAttribute attach="attributes-color"    args={[armStars.colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.035}
          sizeAttenuation
          vertexColors
          map={spark}
          alphaMap={spark}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          transparent
        />
      </points>

      {/* blue O/B clusters — bright knots strung along arms */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[armClusters.positions, 3]} />
          <bufferAttribute attach="attributes-color"    args={[armClusters.colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.05}
          sizeAttenuation
          vertexColors
          map={spark}
          alphaMap={spark}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          transparent
        />
      </points>

      {/* HII regions — pink-magenta soft glows at star-forming knots */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[hiiRegions.positions, 3]} />
          <bufferAttribute attach="attributes-color"    args={[hiiRegions.colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.12}
          sizeAttenuation
          vertexColors
          map={soft}
          alphaMap={soft}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          transparent
          opacity={0.6}
        />
      </points>

      {/* dust lanes — drawn LAST with normal (non-additive) blending so the
          dark color absorbs light from layers below */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[armDust.positions, 3]} />
          <bufferAttribute attach="attributes-color"    args={[armDust.colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.10}
          sizeAttenuation
          vertexColors
          map={soft}
          alphaMap={soft}
          depthWrite={false}
          transparent
          opacity={0.85}
        />
      </points>
    </group>
  )
}
