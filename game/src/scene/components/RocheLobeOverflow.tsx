import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { sparkTexture } from './discTexture'

interface RocheLobeOverflowProps {
  /** Accretor (e.g., the player star) — receives the mass. */
  accretorPos: [number, number, number]
  accretorRadius: number
  /** Donor (companion) — overflowing star, source of the mass stream.
   *  Must already exist in the scene; this component does NOT render
   *  the donor star — that's Binary Partner's job. */
  donorPos: [number, number, number]
  donorRadius: number
  /** Current RLO upgrade level, 0..99. */
  level: number
}

// Roche Lobe Overflow — in a close binary, when one star expands past
// its Roche lobe, gas streams from the donor through the L1 Lagrangian
// point onto the companion. This is the mechanism behind novae, X-ray
// binaries, and cataclysmic variables — the "stars eating each other"
// scenario.
//
// Visual: a glowing particle stream from the donor to the accretor,
// curved via a quadratic Bezier to suggest the Coriolis deflection
// real accretion streams show. Particle count + brightness scale with
// upgrade level (sqrt curve, L25 is the calibrated baseline).
//
// The donor star itself also renders here — when RLO is off the
// companion doesn't appear. (Once Binary Partner is wired in, the
// companion will live there and RLO just adds the stream on top.)

const BASE_PARTICLE_COUNT = 150  // particles at L25 baseline (more for vortex density)
const STREAM_FLOW_PERIOD  = 1.4  // seconds per particle traversal
const STREAM_BOW          = 0.35 // perpendicular curve amount (× binary distance)
const PARTICLE_SIZE       = 0.10
// Vortex shape: particles disperse around the donor and funnel toward
// the accretor. Radius starts wide and tapers via (1-t)^TAPER_POWER.
const VORTEX_RADIUS_MULT  = 1.10 // initial spread radius (× donorRadius)
const VORTEX_TAPER_POWER  = 1.6  // how aggressively the cone narrows
// Swirl: angular rotation of the particle's offset over time + along stream.
const VORTEX_SWIRL_HZ     = 0.4  // global rotation rate
const VORTEX_TWIST        = 2.5  // additional angular sweep per unit t

export function RocheLobeOverflow({
  accretorPos,
  accretorRadius,
  donorPos,
  donorRadius,
  level,
}: RocheLobeOverflowProps) {
  const pointsRef = useRef<THREE.Points>(null)
  const texture = useMemo(() => sparkTexture(), [])

  // Geometry of the stream path — recomputed only when star positions change.
  const path = useMemo(() => {
    const ap = new THREE.Vector3().fromArray(accretorPos)
    const dp = new THREE.Vector3().fromArray(donorPos)
    const dir = new THREE.Vector3().subVectors(ap, dp).normalize()
    // Start just outside the donor's surface on the side facing accretor.
    const start = dp.clone().addScaledVector(dir, donorRadius * 1.05)
    // End just outside the accretor's surface on the side facing donor.
    const end = ap.clone().addScaledVector(dir, -accretorRadius * 1.05)
    const dist = start.distanceTo(end)
    const mid = start.clone().add(end).multiplyScalar(0.5)
    // Bow direction: perpendicular to binary axis (world-up × dir gives
    // a perpendicular pointing roughly upward in scene space).
    const worldUp = new THREE.Vector3(0, 1, 0)
    const perp = new THREE.Vector3().crossVectors(worldUp, dir).normalize()
    const control = mid.clone().addScaledVector(perp, dist * STREAM_BOW)
    return { start, end, control, dist }
  }, [accretorPos, accretorRadius, donorPos, donorRadius])

  // Particle count + scaling derived from level.
  const particleCount = useMemo(() => {
    if (level <= 0) return 0
    const scale = Math.sqrt(level / 25)
    return Math.max(12, Math.round(BASE_PARTICLE_COUNT * scale))
  }, [level])

  const peakAlpha = useMemo(() => {
    if (level <= 0) return 0
    return Math.min(0.95, 0.4 + 0.6 * Math.sqrt(level / 99))
  }, [level])

  // Pre-allocated phase offsets so each particle sits at a different
  // point along the stream and the flow reads as continuous.
  const phaseOffsets = useMemo(() => {
    const arr = new Float32Array(particleCount)
    for (let i = 0; i < particleCount; i++) arr[i] = i / Math.max(1, particleCount)
    return arr
  }, [particleCount])

  // Per-particle angular offset around the central stream axis — gives
  // each particle its own position on the vortex's circular cross-section.
  // Hash from index so the distribution is deterministic but jittery.
  const angularOffsets = useMemo(() => {
    const arr = new Float32Array(particleCount)
    for (let i = 0; i < particleCount; i++) {
      const x = Math.sin(i * 12.9898) * 43758.5453
      arr[i] = (x - Math.floor(x)) * Math.PI * 2
    }
    return arr
  }, [particleCount])

  // Per-particle radial jitter — slight variation so the vortex doesn't
  // look like a perfect mathematical cone.
  const radialJitter = useMemo(() => {
    const arr = new Float32Array(particleCount)
    for (let i = 0; i < particleCount; i++) {
      const x = Math.sin(i * 78.233) * 12347.789
      arr[i] = 0.6 + (x - Math.floor(x)) * 0.6  // 0.6 - 1.2
    }
    return arr
  }, [particleCount])

  // Per-particle brightness jitter — most particles sit around the
  // baseline (~0.85), a few flare brighter (up to ~3×). The pow(hash, 8)
  // term is ~0 for most values and only spikes up when hash > 0.9,
  // creating rare bright sparkles in the vortex.
  const brightnessJitter = useMemo(() => {
    const arr = new Float32Array(particleCount)
    for (let i = 0; i < particleCount; i++) {
      const x = Math.sin(i * 24.781) * 73928.341
      const hash = x - Math.floor(x)            // [0, 1)
      const baseline = 0.65 + hash * 0.40       // 0.65 - 1.05
      const spike    = Math.pow(hash, 8) * 2.0  // ~0 for most, ~2 for top tail
      arr[i] = baseline + spike
    }
    return arr
  }, [particleCount])

  const positions = useMemo(
    () => new Float32Array(Math.max(1, particleCount) * 3),
    [particleCount],
  )
  const colors = useMemo(
    () => new Float32Array(Math.max(1, particleCount) * 3),
    [particleCount],
  )

  const elapsed = useRef(0)

  // Pre-allocated working vectors so the per-frame math doesn't allocate.
  const tmpBase    = useRef(new THREE.Vector3())
  const tmpTangent = useRef(new THREE.Vector3())
  const tmpRight   = useRef(new THREE.Vector3())
  const tmpUpVec   = useRef(new THREE.Vector3())
  const worldUp    = useRef(new THREE.Vector3(0, 1, 0))

  useFrame((_, delta) => {
    if (level <= 0 || particleCount === 0 || !pointsRef.current) return
    elapsed.current += delta

    const geom = pointsRef.current.geometry as THREE.BufferGeometry
    const posAttr = geom.attributes.position as THREE.BufferAttribute
    const colAttr = geom.attributes.color as THREE.BufferAttribute
    const posArr = posAttr.array as Float32Array
    const colArr = colAttr.array as Float32Array

    const baseProgress = (elapsed.current / STREAM_FLOW_PERIOD) % 1.0
    const globalSwirl = elapsed.current * VORTEX_SWIRL_HZ * Math.PI * 2

    for (let i = 0; i < particleCount; i++) {
      const phase = (baseProgress + phaseOffsets[i] + 1.0) % 1.0
      const t = phase
      const omt = 1 - t

      // Base position on the central Bezier path.
      const w0 = omt * omt, w1 = 2 * omt * t, w2 = t * t
      tmpBase.current.set(0, 0, 0)
        .addScaledVector(path.start,   w0)
        .addScaledVector(path.control, w1)
        .addScaledVector(path.end,     w2)

      // Bezier tangent: B'(t) = 2(1-t)(P1-P0) + 2t(P2-P1)
      // Re-grouped coefficients on P0, P1, P2: [-2(1-t), 2(1-2t), 2t]
      tmpTangent.current.set(0, 0, 0)
        .addScaledVector(path.start,   -2 * omt)
        .addScaledVector(path.control,  2 * (1 - 2 * t))
        .addScaledVector(path.end,      2 * t)
        .normalize()

      // Two perpendicular vectors spanning the cross-section plane.
      tmpRight.current.crossVectors(tmpTangent.current, worldUp.current).normalize()
      tmpUpVec.current.crossVectors(tmpRight.current, tmpTangent.current).normalize()

      // Vortex offset: wide at the donor end, tapers toward the accretor.
      // Particle rotates around the central axis over time + along t.
      const taper = Math.pow(1 - t, VORTEX_TAPER_POWER)
      const offsetRadius = donorRadius * VORTEX_RADIUS_MULT * taper * radialJitter[i]
      const angle = angularOffsets[i] + globalSwirl + t * VORTEX_TWIST
      const cosA = Math.cos(angle), sinA = Math.sin(angle)

      const px = tmpBase.current.x + (tmpRight.current.x * cosA + tmpUpVec.current.x * sinA) * offsetRadius
      const py = tmpBase.current.y + (tmpRight.current.y * cosA + tmpUpVec.current.y * sinA) * offsetRadius
      const pz = tmpBase.current.z + (tmpRight.current.z * cosA + tmpUpVec.current.z * sinA) * offsetRadius

      posArr[i * 3 + 0] = px
      posArr[i * 3 + 1] = py
      posArr[i * 3 + 2] = pz

      // Warm orange palette. Brightness rises toward the accretor end
      // (gas heating up as Kepler velocities increase / shock-impact),
      // and per-particle jitter adds bright sparkles in the mix.
      const brightness = (0.45 + 0.55 * t) * peakAlpha * brightnessJitter[i]
      colArr[i * 3 + 0] = 1.00 * brightness
      colArr[i * 3 + 1] = 0.70 * brightness
      colArr[i * 3 + 2] = 0.32 * brightness
    }
    posAttr.needsUpdate = true
    colAttr.needsUpdate = true
  })

  if (level <= 0) return null

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={particleCount}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
          count={particleCount}
        />
      </bufferGeometry>
      <pointsMaterial
        size={PARTICLE_SIZE}
        sizeAttenuation
        map={texture}
        vertexColors
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        alphaTest={0.01}
        toneMapped={false}
      />
    </points>
  )
}
