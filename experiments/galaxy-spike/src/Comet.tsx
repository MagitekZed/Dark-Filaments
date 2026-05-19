import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { sparkTexture, discTexture } from './discTexture'

interface CometProps {
  /** Semi-major axis of the orbital ellipse. */
  semiMajorAxis?: number
  /** Eccentricity 0..1. Real comets are typically 0.8-0.99. */
  eccentricity?: number
  /** Inclination of orbit plane from the ecliptic, in radians. */
  inclination?: number
  /** In-plane rotation of the orbit (longitude of perihelion). */
  argumentOfPerihelion?: number
  /** Seconds for one full orbit. */
  orbitPeriod?: number
  /** Starting eccentric anomaly (0 = perihelion). */
  initialAnomaly?: number
  nucleusRadius?: number
  /** Max trailing length of the dust tail. */
  tailLength?: number
  tailParticles?: number
}

// A passing comet — nucleus + coma glow + animated dust tail.
//
// Orbit: parametric ellipse with the sun at one focus. Position computed
// from the eccentric anomaly each frame (this is an approximation — true
// Keplerian motion would solve Kepler's equation for time-vs-anomaly, but
// linear advancement of E gives close-enough motion for visuals).
//
// Tail: particles distributed along the sun-away direction from the
// nucleus. Each particle has a `life` parameter that advances per frame;
// when life hits 1, respawn at the nucleus. Tail length and brightness
// scale with inverse distance from the sun (closer = bigger + brighter,
// matching how real comets only develop visible tails near perihelion).
export function Comet({
  semiMajorAxis = 16,
  eccentricity = 0.78,
  inclination = 0.35,
  argumentOfPerihelion = 0.6,
  orbitPeriod = 220,
  initialAnomaly = 1.4,
  nucleusRadius = 0.08,
  tailLength = 5.0,
  tailParticles = 700,
}: CometProps) {
  const nucleusRef = useRef<THREE.Group>(null)
  const comaSpriteRef = useRef<THREE.Sprite>(null)
  const comaMatRef = useRef<THREE.SpriteMaterial>(null)
  const tailGeomRef = useRef<THREE.BufferGeometry>(null)
  const sparkTex = useMemo(() => sparkTexture(), [])
  const softTex = useMemo(() => discTexture(), [])

  const anomalyRef = useRef(initialAnomaly)
  const timeRef = useRef(0)
  const cometPos = useMemo(() => new THREE.Vector3(), [])
  const sunAway = useMemo(() => new THREE.Vector3(), [])

  // pre-computed orbit constants
  const a = semiMajorAxis
  const e = eccentricity
  const b = a * Math.sqrt(1 - e * e)
  const cosAop = Math.cos(argumentOfPerihelion)
  const sinAop = Math.sin(argumentOfPerihelion)
  const cosInc = Math.cos(inclination)
  const sinInc = Math.sin(inclination)

  // tail particle state
  const tail = useMemo(() => {
    const positions = new Float32Array(tailParticles * 3)
    const colors = new Float32Array(tailParticles * 3)
    const life = new Float32Array(tailParticles)
    const speed = new Float32Array(tailParticles)
    const perp = new Float32Array(tailParticles * 3)
    for (let i = 0; i < tailParticles; i++) {
      life[i] = Math.random()
      speed[i] = 0.45 + Math.random() * 0.55
      perp[i * 3]     = (Math.random() - 0.5) * 0.06
      perp[i * 3 + 1] = (Math.random() - 0.5) * 0.06
      perp[i * 3 + 2] = (Math.random() - 0.5) * 0.06
    }
    return { positions, colors, life, speed, perp }
  }, [tailParticles])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1)
    timeRef.current += dt
    anomalyRef.current += (Math.PI * 2 / orbitPeriod) * dt
    const E = anomalyRef.current
    const t = timeRef.current

    // ellipse position with focus at origin
    const px = a * (Math.cos(E) - e)
    const pz = b * Math.sin(E)
    // rotate in-plane by argument of perihelion
    const xRot = px * cosAop - pz * sinAop
    const zRot = px * sinAop + pz * cosAop
    // tilt by inclination around the x axis
    cometPos.set(xRot, zRot * sinInc, zRot * cosInc)

    if (nucleusRef.current) nucleusRef.current.position.copy(cometPos)

    // sun-away direction (sun at origin)
    const distFromSun = cometPos.length()
    if (distFromSun > 0.001) {
      sunAway.copy(cometPos).divideScalar(distFromSun)
    } else {
      sunAway.set(1, 0, 0)
    }

    // Tail intensity — high floor so the comet is always visible.
    // Real comets only develop tails near perihelion, but for "always cool"
    // we keep the tail strong with only mild variation by distance.
    const tailIntensity =
      0.85 + 0.30 * Math.min(1.0, 3.0 / Math.max(distFromSun, 1.5))

    // Sum-of-sines flicker — irregular brightness modulation so the comet
    // visibly pulses without being mechanically periodic. Bloom amplifies
    // the swings since each peak crosses the luminance threshold.
    const flicker =
      0.85 +
      0.35 * Math.sin(t * 3.7) +
      0.20 * Math.sin(t * 7.1 + 1.7) +
      0.15 * Math.sin(t * 11.3 + 4.1)
    const clampedFlicker = Math.max(0.55, flicker)

    // Apply flicker to coma sprite — scale + opacity
    if (comaSpriteRef.current) {
      const comaScale = nucleusRadius * 5.5 * clampedFlicker
      comaSpriteRef.current.scale.setScalar(comaScale)
    }
    if (comaMatRef.current) {
      comaMatRef.current.opacity = 0.55 + 0.35 * clampedFlicker
    }

    // Tail brightness also rides the flicker, slightly damped
    const tailFlicker = 0.7 + 0.4 * clampedFlicker

    const positions = tail.positions
    const colors = tail.colors
    for (let i = 0; i < tailParticles; i++) {
      let l = tail.life[i] + tail.speed[i] * dt * 0.35
      if (l >= 1) {
        l = 0
        tail.speed[i] = 0.45 + Math.random() * 0.55
        tail.perp[i * 3]     = (Math.random() - 0.5) * 0.06
        tail.perp[i * 3 + 1] = (Math.random() - 0.5) * 0.06
        tail.perp[i * 3 + 2] = (Math.random() - 0.5) * 0.06
      }
      tail.life[i] = l

      // perpendicular jitter grows as the particle drifts (tail fans out)
      const fanOut = 1 + l * 1.4
      const ext = l * tailLength * tailIntensity
      const i3 = i * 3
      positions[i3]     = cometPos.x + sunAway.x * ext + tail.perp[i3]     * fanOut
      positions[i3 + 1] = cometPos.y + sunAway.y * ext + tail.perp[i3 + 1] * fanOut
      positions[i3 + 2] = cometPos.z + sunAway.z * ext + tail.perp[i3 + 2] * fanOut

      // brightness: bright near nucleus, fading at tip × tail intensity × flicker
      const fade = (1 - l) * tailIntensity * tailFlicker
      // color: white-cyan near nucleus, fading bluer toward tip
      colors[i3]     = (0.92 - l * 0.30) * fade
      colors[i3 + 1] = (0.96 - l * 0.20) * fade
      colors[i3 + 2] = 1.0 * fade
    }

    if (tailGeomRef.current) {
      tailGeomRef.current.attributes.position.needsUpdate = true
      tailGeomRef.current.attributes.color.needsUpdate    = true
    }
  })

  return (
    <>
      {/* nucleus + coma glow — group follows the comet position */}
      <group ref={nucleusRef}>
        <mesh>
          <sphereGeometry args={[nucleusRadius, 16, 16]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        {/* coma — soft glow billboard around nucleus, animated scale+opacity */}
        <sprite
          ref={comaSpriteRef}
          scale={[nucleusRadius * 5.5, nucleusRadius * 5.5, 1]}
        >
          <spriteMaterial
            ref={comaMatRef}
            map={softTex}
            color="#b8d8ff"
            blending={THREE.AdditiveBlending}
            transparent
            opacity={0.85}
            depthWrite={false}
          />
        </sprite>
      </group>

      {/* tail particles — world-space, computed each frame from comet pos + sun-away */}
      <points>
        <bufferGeometry ref={tailGeomRef}>
          <bufferAttribute attach="attributes-position" args={[tail.positions, 3]} />
          <bufferAttribute attach="attributes-color"    args={[tail.colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.05}
          sizeAttenuation
          vertexColors
          map={sparkTex}
          alphaMap={sparkTex}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          transparent
          opacity={1.0}
        />
      </points>
    </>
  )
}
