import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { discTexture, sparkTexture } from './discTexture'

interface PlasmaArcsProps {
  starRadius?: number
  arcs: number
  particlesPerArc: number
  /** Arc peak height as a multiplier on starRadius (1.0 = at surface). */
  heightMin: number
  heightMax: number
  /** Angular separation between foot points in radians. */
  angularSpanMin: number
  angularSpanMax: number
  /** Particle speed along the arc per second (t units / s). */
  speedMin: number
  speedMax: number
  particleSize: number
  /** Hot color near arc peak. */
  hotColor: string
  /** Cool color near foot points. */
  coolColor: string
  /** Constant per-particle perpendicular scatter as fraction of starRadius. */
  perpJitter: number
  /** Amplitude of smooth wobble along the arc (fraction of starRadius). */
  wobbleAmp?: number
  /** How many wobble cycles per arc traversal (higher = jaggier). */
  wobbleFreq?: number
  /** Width fluctuation amplitude along the arc (0 = constant width). */
  widthFluxAmp?: number
  /** Width fluctuation cycles per arc length. */
  widthFluxFreq?: number
  /** Width fluctuation scroll speed in cycles/sec (pattern travels along arc over time). */
  widthFluxSpeed?: number
  /**
   * Fire-gradient mode: scrolling yellow↔red bands traveling along the arc.
   * When > 0, the hotColor/coolColor are interpreted as the two endpoints of
   * the fire palette and animated. Speed = palette cycles per second.
   */
  fireSpeed?: number
  /** Number of color bands visible along the arc when fire mode is on. */
  fireBands?: number
  /** Arc lifetime range in seconds. Each arc fades in, holds, fades out. */
  lifetimeMin: number
  lifetimeMax: number
  /**
   * Sprite shape: 'spark' = sharp pinprick (good for tight loops), 'soft' =
   * soft glow (good for gas-cloud / flame look).
   */
  textureKind?: 'spark' | 'soft'
  opacity: number
}

// An arc IS its path: two foot points on the star surface plus a peak
// above the midpoint, AND a per-arc wobble seed so every particle on this
// arc traces the same wavy curve. Plus a lifetime so arcs come and go.
interface Arc {
  A: THREE.Vector3
  peak: THREE.Vector3
  B: THREE.Vector3
  seed: number
  birthTime: number   // useFrame-time accumulator value at this arc's birth
  lifetime: number    // seconds before this arc respawns somewhere else
  alpha: number       // current envelope value, 0..1, updated each frame
}

const FADE_IN_SEC = 3.5
const FADE_OUT_SEC = 4.5

function randomDir(out: THREE.Vector3): void {
  let l = 0
  do {
    out.set(
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
    )
    l = out.length()
  } while (l < 0.1 || l > 1.0)
  out.divideScalar(l)
}

// (Re)generate the geometry + seed for an arc in place. Used both at
// initial setup and whenever an arc dies and respawns somewhere else.
function regenerateArc(
  arc: Arc,
  starRadius: number,
  heightMin: number,
  heightMax: number,
  spanMin: number,
  spanMax: number,
): void {
  const aDir = new THREE.Vector3()
  randomDir(aDir)
  const fallback = new THREE.Vector3(0, 1, 0)
  if (Math.abs(aDir.dot(fallback)) > 0.9) fallback.set(1, 0, 0)
  const tangent = fallback.clone().cross(aDir).normalize()
  const bitangent = aDir.clone().cross(tangent).normalize()
  const span = spanMin + Math.random() * (spanMax - spanMin)
  const azimuth = Math.random() * Math.PI * 2
  const bDir = aDir.clone().multiplyScalar(Math.cos(span))
    .addScaledVector(tangent, Math.cos(azimuth) * Math.sin(span))
    .addScaledVector(bitangent, Math.sin(azimuth) * Math.sin(span))
  arc.A.copy(aDir).multiplyScalar(starRadius)
  arc.B.copy(bDir).multiplyScalar(starRadius)
  const peakDir = aDir.clone().add(bDir).normalize()
  const height = heightMin + Math.random() * (heightMax - heightMin)
  arc.peak.copy(peakDir).multiplyScalar(starRadius * height)
  arc.seed = Math.random() * 100
}

// Quadratic Bezier: P(t) = (1-t)²·A + 2(1-t)t·peak + t²·B
function bezier(out: THREE.Vector3, A: THREE.Vector3, P: THREE.Vector3, B: THREE.Vector3, t: number): void {
  const om = 1 - t
  out.copy(A).multiplyScalar(om * om)
    .addScaledVector(P, 2 * om * t)
    .addScaledVector(B, t * t)
}

export function PlasmaArcs({
  starRadius = 1.0,
  arcs: arcCount,
  particlesPerArc,
  heightMin,
  heightMax,
  angularSpanMin,
  angularSpanMax,
  speedMin,
  speedMax,
  particleSize,
  hotColor,
  coolColor,
  perpJitter,
  wobbleAmp = 0,
  wobbleFreq = 3,
  widthFluxAmp = 0,
  widthFluxFreq = 3,
  widthFluxSpeed = 0,
  fireSpeed = 0,
  fireBands = 2.5,
  lifetimeMin,
  lifetimeMax,
  textureKind = 'spark',
  opacity,
}: PlasmaArcsProps) {
  const geomRef = useRef<THREE.BufferGeometry>(null)
  const texture = useMemo(
    () => (textureKind === 'soft' ? discTexture() : sparkTexture()),
    [textureKind],
  )

  const arcs = useMemo<Arc[]>(() => {
    const arr: Arc[] = []
    for (let i = 0; i < arcCount; i++) {
      const arc: Arc = {
        A: new THREE.Vector3(),
        peak: new THREE.Vector3(),
        B: new THREE.Vector3(),
        seed: 0,
        birthTime: 0,
        lifetime: lifetimeMin + Math.random() * (lifetimeMax - lifetimeMin),
        alpha: 0,
      }
      regenerateArc(arc, starRadius, heightMin, heightMax, angularSpanMin, angularSpanMax)
      // stagger initial birth times so the arcs aren't synchronized.
      // negative birthTime → at t=0 the age is positive, placing each arc
      // randomly along its lifecycle (some emerging, some at peak, some fading).
      arc.birthTime = -Math.random() * arc.lifetime
      arr.push(arc)
    }
    return arr
  }, [arcCount, starRadius, heightMin, heightMax, angularSpanMin, angularSpanMax, lifetimeMin, lifetimeMax])

  const total = arcCount * particlesPerArc
  const hot = useMemo(() => new THREE.Color(hotColor), [hotColor])
  const cool = useMemo(() => new THREE.Color(coolColor), [coolColor])

  const { state, positions, colors } = useMemo(() => {
    const positions = new Float32Array(total * 3)
    const colors = new Float32Array(total * 3)
    const state = {
      arcIdx: new Int16Array(total),
      t:      new Float32Array(total),
      speed:  new Float32Array(total),
      offX:   new Float32Array(total),
      offY:   new Float32Array(total),
      offZ:   new Float32Array(total),
    }
    for (let a = 0; a < arcCount; a++) {
      for (let p = 0; p < particlesPerArc; p++) {
        const i = a * particlesPerArc + p
        state.arcIdx[i] = a
        state.t[i]      = Math.random()
        state.speed[i]  = speedMin + Math.random() * (speedMax - speedMin)
        state.offX[i]   = (Math.random() - 0.5) * perpJitter * starRadius * 2
        state.offY[i]   = (Math.random() - 0.5) * perpJitter * starRadius * 2
        state.offZ[i]   = (Math.random() - 0.5) * perpJitter * starRadius * 2
      }
    }
    // useFrame will compute real values on first frame — leave buffers as zeros
    return { state, positions, colors }
  }, [total, arcCount, particlesPerArc, speedMin, speedMax, perpJitter, starRadius])

  const tmpV = useMemo(() => new THREE.Vector3(), [])
  const tmpC = useMemo(() => new THREE.Color(), [])
  const timeRef = useRef(0)

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1)
    timeRef.current += dt
    const now = timeRef.current

    // update each arc's lifecycle (alpha envelope + respawn when expired)
    for (let a = 0; a < arcCount; a++) {
      const arc = arcs[a]
      let age = now - arc.birthTime
      if (age >= arc.lifetime) {
        // respawn somewhere else with new geometry, new seed, new lifetime
        regenerateArc(arc, starRadius, heightMin, heightMax, angularSpanMin, angularSpanMax)
        arc.birthTime = now
        arc.lifetime = lifetimeMin + Math.random() * (lifetimeMax - lifetimeMin)
        age = 0
      }
      const hold = Math.max(0, arc.lifetime - FADE_IN_SEC - FADE_OUT_SEC)
      if (age < FADE_IN_SEC) {
        arc.alpha = age / FADE_IN_SEC
      } else if (age < FADE_IN_SEC + hold) {
        arc.alpha = 1
      } else {
        arc.alpha = Math.max(0, 1 - (age - FADE_IN_SEC - hold) / FADE_OUT_SEC)
      }
    }

    // per-particle update
    for (let i = 0; i < total; i++) {
      let t = state.t[i] + state.speed[i] * dt
      if (t >= 1) {
        t = 0
        state.speed[i] = speedMin + Math.random() * (speedMax - speedMin)
        state.offX[i]  = (Math.random() - 0.5) * perpJitter * starRadius * 2
        state.offY[i]  = (Math.random() - 0.5) * perpJitter * starRadius * 2
        state.offZ[i]  = (Math.random() - 0.5) * perpJitter * starRadius * 2
      }
      state.t[i] = t

      const arc = arcs[state.arcIdx[i]]
      bezier(tmpV, arc.A, arc.peak, arc.B, t)
      const i3 = i * 3

      // shared per-arc wobble: every particle on this arc traces the
      // same wobbled curve, like plasma along one magnetic field line.
      const tw = t * wobbleFreq * Math.PI * 2.0
      const s = arc.seed
      const wA = wobbleAmp * starRadius
      const wx = (Math.sin(tw * 0.7 + s * 3.1) + Math.sin(tw * 1.6 + s * 5.3) * 0.5) * wA
      const wy = (Math.sin(tw * 0.9 + s * 4.7) + Math.sin(tw * 1.3 + s * 6.1) * 0.5) * wA
      const wz = (Math.sin(tw * 1.1 + s * 2.3) + Math.sin(tw * 2.0 + s * 7.7) * 0.5) * wA

      // width fluctuation along the path — sum of two sines at different
      // frequencies (beat pattern, never quite repeats), scrolling along
      // the arc over time when widthFluxSpeed > 0.
      let widthMul = 1.0
      if (widthFluxAmp > 0) {
        const wbase = (t * widthFluxFreq - now * widthFluxSpeed + s * 1.13) * Math.PI * 2.0
        const wsum = Math.sin(wbase) * 0.65 +
                     Math.sin(wbase * 1.7 + s * 3.7) * 0.35
        widthMul = 1.0 + widthFluxAmp * wsum
      }

      positions[i3]     = tmpV.x + state.offX[i] * widthMul + wx
      positions[i3 + 1] = tmpV.y + state.offY[i] * widthMul + wy
      positions[i3 + 2] = tmpV.z + state.offZ[i] * widthMul + wz

      // color — either fire-gradient (scrolling yellow↔red bands) or the
      // default V-shape gradient (cool at feet, hot at peak). Fire mode
      // uses a beat-summed sine pair so the gradient feels organically
      // irregular rather than mechanically periodic.
      let u: number
      if (fireSpeed > 0) {
        const wp = (t * fireBands - now * fireSpeed + s * 0.31) * Math.PI * 2.0
        const fsum = Math.sin(wp) * 0.70 +
                     Math.sin(wp * 1.6 + s * 4.3) * 0.30
        u = 0.5 + 0.5 * fsum
      } else {
        u = t < 0.5 ? t * 2 : (1 - t) * 2
      }
      tmpC.copy(cool).lerp(hot, u)

      const particleFade = Math.sin(t * Math.PI)
      const brightness = particleFade * arc.alpha
      colors[i3]     = tmpC.r * brightness
      colors[i3 + 1] = tmpC.g * brightness
      colors[i3 + 2] = tmpC.b * brightness
    }

    if (geomRef.current) {
      geomRef.current.attributes.position.needsUpdate = true
      geomRef.current.attributes.color.needsUpdate    = true
    }
  })

  return (
    <points>
      <bufferGeometry ref={geomRef}>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color"    args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={particleSize}
        sizeAttenuation
        vertexColors
        map={texture}
        alphaMap={texture}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        transparent
        opacity={opacity}
      />
    </points>
  )
}
