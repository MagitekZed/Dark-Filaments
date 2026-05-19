import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { discTexture } from './discTexture'

interface WolfRayetPlumesProps {
  /** Host star radius — drives plume scale and footpoint sphere. */
  starRadius: number
  /** How many plumes are active at any one moment. */
  activePlumes?: number
  /** Plume lifetime range in seconds. */
  lifetimeMin?: number
  lifetimeMax?: number
  /** Particles per plume — more = denser, slower to render. */
  particlesPerPlume?: number
  /** Color at the plume's leading edge (hot ionized gas). */
  hotColor?: string
  /** Color near the host star's surface (cooler base material). */
  coolColor?: string
  /** Bezier control-point height as a multiplier on starRadius. */
  arcHeight?: number
  /** Per-particle wobble amplitude × starRadius. */
  wobbleAmp?: number
  /** Per-particle perpendicular jitter for width variance. */
  widthJitter?: number
  /** Particle size (world units, before sizeAttenuation). */
  particleSize?: number
  /**
   * When true, every initial plume starts at age=0 (instead of the default
   * random stagger across each plume's lifetime). Use this when mounting
   * the component as part of an activation sequence so the plumes visibly
   * START shooting from the surface, rather than popping in mid-lifecycle.
   * Subsequent recycled plumes always start fresh by construction.
   */
  freshStart?: boolean
}

// Wolf-Rayet plumes — dramatic, slowly evolving stellar-wind shells
// that emerge from one surface foot, extend outward through a curved
// path, and reach a second surface foot over a long lifetime.
//
// Unlike PlasmaArcs (which is built around fast cycling particles on a
// shared continuous arc), each WR plume here:
//   • starts at a single random surface point at t=0
//   • grows its visible length linearly over its 10–20 s lifetime
//   • ends at a second surface point at t=lifetime
//   • carries its own wobble + width jitter so each plume looks distinct
//
// Path: quadratic Bezier from footA → control → footB. Control point
// is positioned outside the star along the average outward normal with
// some perpendicular kick for asymmetry. Two perpendicular axes carry
// independent sinusoidal wobble so the plume isn't a clean arc.

interface Plume {
  age: number
  lifetime: number
  footA: THREE.Vector3
  footB: THREE.Vector3
  control: THREE.Vector3
  perpAxis1: THREE.Vector3
  perpAxis2: THREE.Vector3
  wobbleFreq1: number
  wobbleFreq2: number
  wobblePhase1: number
  wobblePhase2: number
  wobbleAmp1: number
  wobbleAmp2: number
}

function buildPlume(
  starRadius: number,
  lifetimeMin: number,
  lifetimeMax: number,
  arcHeight: number,
  wobbleAmp: number,
): Plume {
  // Foot A — uniform on sphere.
  const theta1 = Math.random() * Math.PI * 2
  const phi1 = Math.acos(2 * Math.random() - 1)
  const footA = new THREE.Vector3(
    Math.sin(phi1) * Math.cos(theta1),
    Math.sin(phi1) * Math.sin(theta1),
    Math.cos(phi1),
  ).multiplyScalar(starRadius)

  // Foot B — separated from A by 60°–180° on the sphere.
  const sepAngle = (60 + Math.random() * 120) * Math.PI / 180
  // Find an axis perpendicular to footA to rotate around.
  const tempUp = Math.abs(footA.y) < 0.95
    ? new THREE.Vector3(0, 1, 0)
    : new THREE.Vector3(1, 0, 0)
  const rotAxis = new THREE.Vector3().crossVectors(footA, tempUp).normalize()
  // Add some random spin to the rotation axis for direction variety.
  const spinRot = Math.random() * Math.PI * 2
  rotAxis.applyAxisAngle(footA.clone().normalize(), spinRot)
  const footB = footA.clone().applyAxisAngle(rotAxis, sepAngle)

  // Control: midpoint pushed outward + slight perpendicular kick.
  const mid = footA.clone().add(footB).multiplyScalar(0.5)
  const outward = mid.clone().normalize()
  const heightAmt = (0.9 + Math.random() * 0.4) * arcHeight * starRadius
  const sideAxis = new THREE.Vector3().crossVectors(outward, footB.clone().sub(footA)).normalize()
  const sideAmt = (Math.random() - 0.5) * arcHeight * 0.5 * starRadius
  const control = mid
    .clone()
    .addScaledVector(outward, heightAmt)
    .addScaledVector(sideAxis, sideAmt)

  // Perpendicular axes for wobble (orthogonal to the chord A→B).
  const chord = footB.clone().sub(footA).normalize()
  const perpAxis1 = new THREE.Vector3().crossVectors(chord, outward).normalize()
  const perpAxis2 = new THREE.Vector3().crossVectors(chord, perpAxis1).normalize()

  return {
    age: 0,
    lifetime: lifetimeMin + Math.random() * (lifetimeMax - lifetimeMin),
    footA,
    footB,
    control,
    perpAxis1,
    perpAxis2,
    wobbleFreq1: 1.2 + Math.random() * 2.0,
    wobbleFreq2: 2.0 + Math.random() * 3.0,
    wobblePhase1: Math.random() * Math.PI * 2,
    wobblePhase2: Math.random() * Math.PI * 2,
    wobbleAmp1: starRadius * wobbleAmp * (0.6 + Math.random() * 0.8),
    wobbleAmp2: starRadius * wobbleAmp * 0.5 * (0.5 + Math.random() * 0.8),
  }
}

export function WolfRayetPlumes({
  starRadius,
  activePlumes = 3,
  lifetimeMin = 10,
  lifetimeMax = 20,
  particlesPerPlume = 140,
  hotColor = '#d8e4ff',
  coolColor = '#3858b0',
  arcHeight = 5,
  wobbleAmp = 0.18,
  widthJitter = 0.15,
  particleSize = 0.10,
  freshStart = false,
}: WolfRayetPlumesProps) {
  const pointsRef = useRef<THREE.Points>(null)
  const texture = useMemo(() => discTexture(), [])

  const totalParticles = activePlumes * particlesPerPlume

  const positions = useMemo(() => new Float32Array(totalParticles * 3), [totalParticles])
  const colors = useMemo(() => new Float32Array(totalParticles * 3), [totalParticles])

  // Per-particle phase along its plume path (fixed per slot).
  const particlePhases = useMemo(() => {
    const arr = new Float32Array(totalParticles)
    for (let p = 0; p < activePlumes; p++) {
      for (let i = 0; i < particlesPerPlume; i++) {
        // Random phase so the plume doesn't look like a clean comb of points.
        arr[p * particlesPerPlume + i] = Math.random()
      }
    }
    return arr
  }, [totalParticles, activePlumes, particlesPerPlume])

  // Per-particle perpendicular jitter — gives each plume varying width
  // along its length.
  const particleJitter = useMemo(() => {
    const arr = new Float32Array(totalParticles * 2)
    for (let i = 0; i < totalParticles; i++) {
      arr[i * 2 + 0] = (Math.random() - 0.5) * 2  // [-1, 1]
      arr[i * 2 + 1] = (Math.random() - 0.5) * 2
    }
    return arr
  }, [totalParticles])

  // Active plumes state. Initialised lazily on first frame. By default
  // each plume's age is randomised across its lifetime so they look like
  // they've been running for a while when the component mounts. When
  // `freshStart` is true (activation sequence), every initial plume starts
  // at age=0 so they all visibly sweep outward from the surface together —
  // no "pop in" of mid-lifecycle plumes.
  const plumes = useRef<Plume[]>([])
  if (plumes.current.length === 0) {
    for (let p = 0; p < activePlumes; p++) {
      const plume = buildPlume(starRadius, lifetimeMin, lifetimeMax, arcHeight, wobbleAmp)
      plume.age = freshStart ? 0 : Math.random() * plume.lifetime
      plumes.current.push(plume)
    }
  }

  const hotCol = useMemo(() => new THREE.Color(hotColor), [hotColor])
  const coolCol = useMemo(() => new THREE.Color(coolColor), [coolColor])
  const tmpColor = useMemo(() => new THREE.Color(), [])

  useFrame((_, delta) => {
    if (!pointsRef.current) return

    // Advance ages, recycle expired plumes.
    for (let p = 0; p < activePlumes; p++) {
      plumes.current[p].age += delta
      if (plumes.current[p].age >= plumes.current[p].lifetime) {
        plumes.current[p] = buildPlume(starRadius, lifetimeMin, lifetimeMax, arcHeight, wobbleAmp)
      }
    }

    const geom = pointsRef.current.geometry as THREE.BufferGeometry
    const posAttr = geom.attributes.position as THREE.BufferAttribute
    const colAttr = geom.attributes.color as THREE.BufferAttribute
    const posArr = posAttr.array as Float32Array
    const colArr = colAttr.array as Float32Array

    // Lifecycle has two travelling fronts along the plume's path:
    //   • Head front sweeps from foot A to foot B during the growth
    //     phase, reaching the second foot at 52 % of lifetime.
    //   • Tail front sweeps from foot A to foot B during the retract
    //     phase, after a brief hold at full extent. By the end of
    //     retract both fronts have met at foot B and the plume is
    //     "returned to the star."
    // Particles are visible only between tailFront and headFront on
    // their phase.
    const GROWTH_DURATION = 0.52   // growth front reaches 1.0 at 52 % of lifetime
    const RETRACT_START   = 0.65   // tail front starts advancing at 65 % of lifetime
    const RETRACT_END     = 0.97   // tail front reaches 1.0 at 97 % of lifetime
    const FADE_IN_END     = 0.06   // initial appearance softness

    for (let p = 0; p < activePlumes; p++) {
      const plume = plumes.current[p]
      const ageFrac = plume.age / plume.lifetime

      const headFront = Math.min(1, ageFrac / GROWTH_DURATION)
      let tailFront = 0
      if (ageFrac > RETRACT_START) {
        tailFront = Math.min(
          1,
          (ageFrac - RETRACT_START) / (RETRACT_END - RETRACT_START),
        )
      }

      // Initial fade-in envelope so the plume eases into existence
      // rather than popping at t=0.
      const initEnvelope = ageFrac < FADE_IN_END ? ageFrac / FADE_IN_END : 1

      const baseSlot = p * particlesPerPlume
      for (let i = 0; i < particlesPerPlume; i++) {
        const slot = baseSlot + i
        const phase = particlePhases[slot]

        // Particles are visible only between tailFront and headFront.
        // Soft fade at each front so the leading and trailing edges
        // of the plume bleed smoothly instead of popping.
        if (phase >= headFront || phase < tailFront) {
          colArr[slot * 3 + 0] = 0
          colArr[slot * 3 + 1] = 0
          colArr[slot * 3 + 2] = 0
          continue
        }
        const headDelta = headFront - phase
        const tailDelta = phase - tailFront
        const FADE_BAND = 0.08
        const headAlpha = Math.min(1, headDelta / FADE_BAND)
        const tailAlpha = Math.min(1, tailDelta / FADE_BAND)
        const finalAlpha = headAlpha * tailAlpha * initEnvelope

        if (finalAlpha <= 0) {
          colArr[slot * 3 + 0] = 0
          colArr[slot * 3 + 1] = 0
          colArr[slot * 3 + 2] = 0
          continue
        }

        // Bezier(t) along the plume's path.
        const t = phase
        const omt = 1 - t
        const w0 = omt * omt
        const w1 = 2 * omt * t
        const w2 = t * t
        let x = w0 * plume.footA.x + w1 * plume.control.x + w2 * plume.footB.x
        let y = w0 * plume.footA.y + w1 * plume.control.y + w2 * plume.footB.y
        let z = w0 * plume.footA.z + w1 * plume.control.z + w2 * plume.footB.z

        // Path wobble — perpendicular sinusoidal offsets.
        const wob1 = Math.sin(t * Math.PI * 2 * plume.wobbleFreq1 + plume.wobblePhase1) * plume.wobbleAmp1
        const wob2 = Math.cos(t * Math.PI * 2 * plume.wobbleFreq2 + plume.wobblePhase2) * plume.wobbleAmp2
        x += plume.perpAxis1.x * wob1 + plume.perpAxis2.x * wob2
        y += plume.perpAxis1.y * wob1 + plume.perpAxis2.y * wob2
        z += plume.perpAxis1.z * wob1 + plume.perpAxis2.z * wob2

        // Per-particle perpendicular jitter for plume width variance.
        // Width tapers toward the foot points (mid is widest).
        const widthEnv = Math.sin(t * Math.PI)  // 0 at feet, 1 at midpoint
        const jit1 = particleJitter[slot * 2 + 0] * starRadius * widthJitter * widthEnv
        const jit2 = particleJitter[slot * 2 + 1] * starRadius * widthJitter * widthEnv
        x += plume.perpAxis1.x * jit1 + plume.perpAxis2.x * jit2
        y += plume.perpAxis1.y * jit1 + plume.perpAxis2.y * jit2
        z += plume.perpAxis1.z * jit1 + plume.perpAxis2.z * jit2

        posArr[slot * 3 + 0] = x
        posArr[slot * 3 + 1] = y
        posArr[slot * 3 + 2] = z

        // Color: hot at the leading edge (just-emerged particles), cool
        // along the older trailing body. Brightness is overdriven past
        // 1.0 to push pixels above the bloom threshold and produce
        // visible per-particle glow.
        const colorT = Math.min(1, phase + 0.3)  // shift toward hot
        tmpColor.copy(coolCol).lerp(hotCol, colorT)
        const headProximity = Math.exp(-Math.pow((headFront - phase) * 5, 2))
        // Trail glows at ~0.95, head glows at ~2.4 (overdriven for bloom).
        const brightness = (0.95 + 1.45 * headProximity) * finalAlpha
        colArr[slot * 3 + 0] = tmpColor.r * brightness
        colArr[slot * 3 + 1] = tmpColor.g * brightness
        colArr[slot * 3 + 2] = tmpColor.b * brightness
      }
    }
    posAttr.needsUpdate = true
    colAttr.needsUpdate = true
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={totalParticles}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
          count={totalParticles}
        />
      </bufferGeometry>
      <pointsMaterial
        size={particleSize}
        sizeAttenuation
        map={texture}
        vertexColors
        transparent
        opacity={1.0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        alphaTest={0.01}
        toneMapped={false}
      />
    </points>
  )
}
