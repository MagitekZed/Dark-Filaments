import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { consumePulls } from './pullEvents'
import { discTexture } from '../components/discTexture'
import { nowSeconds } from './clock'

interface PullParticlesProps {
  /** World-space gravity target. T1 = the Sun at origin. */
  sunPosition?: [number, number, number]
  /** Number of particles spawned per tap. */
  particlesPerTap?: number
  /** Pool size — max simultaneous particles. */
  maxParticles?: number
  /** Acceleration toward the Sun, in scene-units / sec². Higher = stronger pull. */
  gravity?: number
  /** Particles inside this radius around the Sun are absorbed (despawn). */
  absorbRadius?: number
  /** Minimum spawn distance from Sun — clicks landing inside this radius
   *  are pushed outward so particles have visible runway. */
  minSpawnRadius?: number
  /** Initial speed range, units/sec. Random per-particle inside [min, max].
   *  Values near orbital speed (~sqrt(gravity * radius)) produce particles
   *  that swing partway around the Sun before being absorbed. Slow ones
   *  fall straight in; fast ones make multiple curves before reaching the
   *  photosphere. The mix is what gives every burst its own character. */
  speedMin?: number
  speedMax?: number
  /** Drag coefficient, per second. Each frame velocity decays by
   *  exp(-drag * dt). Drains angular momentum so orbital particles
   *  spiral inward over a few seconds — no permanent orbits. Set to 0
   *  to disable. The default value gives particles enough orbital
   *  character to take varied curves while still guaranteeing they
   *  all get absorbed in roughly 2-5 seconds. */
  drag?: number
  /** World-space size of each particle. With sizeAttenuation they shrink
   *  naturally with camera distance. */
  particleSize?: number
  /** Per-particle depth variance along the camera ray, in world units.
   *  Spreads spawn points "into" the scene around the screen tap point so
   *  the burst reads as occupying 3D space, not a single 2D screen point.
   *  ±depthSpread around the orbital-plane intersection. */
  depthSpread?: number
  /** Soft cap on alive particles. Above this count, the oldest alive
   *  particle starts a fade-out. Prevents pile-up without imposing a
   *  hard lifetime on every particle. */
  softCapAlive?: number
  /** Fade-out duration in seconds. */
  fadeDuration?: number
}

// T1 click feedback: each tap spawns a small burst of particles at the
// player's tap point. Each particle drifts in its own random direction
// at its own speed (near orbital), and gravity from the Sun curves its
// path inward until it's absorbed at the photosphere. Different curves
// per particle, every time, because each one has its own initial vector
// — slow ones fall straight in, fast ones swing around the Sun one or
// more times before being captured.
//
// Visually this directly enacts the T1 click verb (Pull): the player
// pulls matter inward, and the Sun draws it in. Reuses the warm-gold
// zodiacal palette so the burst feels like part of the existing dust
// medium, not a sticker pasted on the scene.
//
// Particles never time out — they're only removed when (a) they touch
// the Sun's photosphere or (b) the alive count exceeds softCapAlive,
// in which case the oldest particle fades out gracefully to free its
// pool slot.

interface Particle {
  alive: boolean
  pos: THREE.Vector3
  vel: THREE.Vector3
  /** Wall-clock seconds when this particle was spawned. Used to pick
   *  the "oldest" particle when the soft cap is exceeded. */
  spawnTime: number
  /** 0 when not fading; otherwise the wall-clock time the fade-out began. */
  fadeStart: number
  /** 0 when not flashing. When a particle reaches absorbRadius it
   *  transitions to a flash state instead of immediately vanishing —
   *  position locks, gravity stops, brightness ramps up to a bright
   *  blue-white peak, then the particle despawns at the end of
   *  FLASH_DURATION. */
  flashStart: number
  /** Per-particle scintillation phase (radians) so adjacent particles
   *  twinkle independently. */
  twinklePhase: number
  /** Per-particle scintillation angular frequency (rad/sec). Different
   *  per particle so the burst's shimmer isn't visually synchronised. */
  twinkleFreq: number
}

const FLASH_DURATION = 0.10        // 100ms ramp from absorption to despawn
const FLASH_PEAK_BRIGHTNESS = 7.0  // additive RGB peak — bloom will catch this
const FLASH_SIZE_MIN_MUL = 5       // smallest flash = 5× the in-fall particle size
const FLASH_SIZE_MAX_MUL = 15      // largest flash = 15× the in-fall particle size

// Custom shader for the absorption flash. Per-vertex size via an aSize
// attribute (pointsMaterial.size is a single material-wide value, so
// we can't vary it per particle without going custom). The fragment
// shader paints a gaussian radial falloff so each flash reads as a
// soft glow rather than a hard-edged disc.
const FLASH_VERT = /* glsl */`
  attribute vec3 color;
  attribute float aSize;
  uniform float uScale;
  varying vec3 vColor;
  void main() {
    vColor = color;
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (uScale / -mvPos.z);
    gl_Position = projectionMatrix * mvPos;
  }
`
const FLASH_FRAG = /* glsl */`
  varying vec3 vColor;
  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float r2 = dot(uv, uv);                  // squared radius (0 center → 0.5 edge)
    if (r2 > 0.25) discard;                  // clip beyond the point quad
    // Gaussian-ish falloff. Higher coefficient = harder edge.
    // 9 lands a soft, smoothly-tapering glow.
    float glow = exp(-r2 * 9.0);
    gl_FragColor = vec4(vColor * glow, glow);
  }
`

const ORBITAL_PLANE = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
const TMP_GRAV = new THREE.Vector3()
const TMP_HIT  = new THREE.Vector3()
const TMP_DIR  = new THREE.Vector3()

export function PullParticles({
  sunPosition = [0, 0, 0],
  particlesPerTap = 9,
  maxParticles = 240,
  gravity = 9.5,
  absorbRadius = 1.15,
  minSpawnRadius = 2.2,
  speedMin = 1.75,
  speedMax = 4.75,
  drag = 0.30,
  particleSize = 0.11,
  depthSpread = 3.5,
  softCapAlive = 110,
  fadeDuration = 0.7,
}: PullParticlesProps) {
  const { camera, size } = useThree()
  const geomRef = useRef<THREE.BufferGeometry>(null)
  const flashGeomRef = useRef<THREE.BufferGeometry>(null)
  const texture = useMemo(() => discTexture(), [])
  const sunPos = useMemo(
    () => new THREE.Vector3(sunPosition[0], sunPosition[1], sunPosition[2]),
    [sunPosition],
  )
  const raycaster = useMemo(() => new THREE.Raycaster(), [])
  const ndcVec = useMemo(() => new THREE.Vector2(), [])

  const particles = useMemo<Particle[]>(() => {
    const arr: Particle[] = []
    for (let i = 0; i < maxParticles; i++) {
      arr.push({
        alive: false,
        pos: new THREE.Vector3(),
        vel: new THREE.Vector3(),
        spawnTime: 0,
        fadeStart: 0,
        flashStart: 0,
        twinklePhase: 0,
        twinkleFreq: 0,
      })
    }
    return arr
  }, [maxParticles])

  // Parallel buffers: in-fall particles render via the first <points>
  // (small, additive, soft texture), flashing particles via a second
  // <points> with a much larger pointsMaterial size. Each particle
  // exists in exactly one buffer at any moment; the other slot is
  // parked off-screen (y = -10000).
  const positions = useMemo(
    () => new Float32Array(maxParticles * 3),
    [maxParticles],
  )
  const colors = useMemo(
    () => new Float32Array(maxParticles * 3),
    [maxParticles],
  )
  const positionsFlash = useMemo(
    () => new Float32Array(maxParticles * 3),
    [maxParticles],
  )
  const colorsFlash = useMemo(
    () => new Float32Array(maxParticles * 3),
    [maxParticles],
  )
  // Per-vertex size for flash particles. Set when a particle transitions
  // to flash state (random 5–15× the in-fall particle size); back to 0
  // when the particle is not flashing.
  const sizesFlash = useMemo(
    () => new Float32Array(maxParticles),
    [maxParticles],
  )

  useMemo(() => {
    for (let i = 0; i < maxParticles; i++) {
      positions[i * 3 + 1] = -10000
      positionsFlash[i * 3 + 1] = -10000
    }
    return null
  }, [maxParticles, positions, positionsFlash])

  // Uniform for size attenuation. PointsMaterial's built-in scale is
  // roughly viewport.height / 2; we match it so 1.0 world unit appears
  // at the same pixel size as a non-custom point. Updated on resize.
  const flashUniforms = useMemo(
    () => ({ uScale: { value: size.height / 2 } }),
    // size.height is captured initially; the resize effect below keeps it live.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
  flashUniforms.uScale.value = size.height / 2

  // Spawn helper. Finds a dead slot (or recycles the oldest) and seeds
  // it with a random direction + speed. Speed is sampled from a range
  // that brackets orbital velocity at typical spawn distances, so the
  // burst's trajectories vary from straight-in fall to multi-orbit swing.
  function spawn(origin: THREE.Vector3, now: number): void {
    let slot: Particle | undefined = particles.find(p => !p.alive)
    if (!slot) {
      // Pool exhausted — recycle the oldest alive particle.
      slot = particles[0]
      for (let i = 1; i < particles.length; i++) {
        if (particles[i].spawnTime < slot.spawnTime) slot = particles[i]
      }
    }
    slot.alive = true
    slot.fadeStart = 0
    slot.flashStart = 0
    slot.spawnTime = now
    slot.pos.copy(origin)
    // Random direction on the sphere, with a vertical squash so particles
    // bias toward the orbital plane (where the visible action lives).
    const u = Math.random() * 2 - 1
    const theta = Math.random() * Math.PI * 2
    const r = Math.sqrt(1 - u * u)
    const speed = speedMin + Math.random() * (speedMax - speedMin)
    slot.vel.set(
      r * Math.cos(theta) * speed,
      u * speed * 0.35,            // squash Y so particles stay near the disc
      r * Math.sin(theta) * speed,
    )
    // Scintillation: each particle gets its own phase and frequency so
    // the burst shimmers without all particles flickering in lockstep.
    // Frequency range ~3-7 Hz gives a fast-twinkle (matches the existing
    // TwinklingStars / Star scintillation pattern, scaled faster).
    slot.twinklePhase = Math.random() * Math.PI * 2
    slot.twinkleFreq  = (3.0 + Math.random() * 4.0) * Math.PI * 2  // rad/sec
  }

  // Project a tap's screen coords into a per-particle world-space spawn
  // point. Casts a ray from the camera through the tap, intersects with
  // the orbital plane (y=0) for a "center" depth, then samples a random
  // distance along the ray within ±depthSpread of that center. Result:
  // particles in a single burst occupy a small line in 3D space along
  // the line of sight, all appearing at the same screen XY but at
  // varied depths — the burst reads as "in" the scene, not pasted flat.
  function spawnPointForRay(sx: number, sy: number): THREE.Vector3 {
    ndcVec.x = (sx / size.width) * 2 - 1
    ndcVec.y = -(sy / size.height) * 2 + 1
    raycaster.setFromCamera(ndcVec, camera)
    const ray = raycaster.ray
    const planeHit = TMP_HIT
    const planeHitOK = ray.intersectPlane(ORBITAL_PLANE, planeHit)
    let tCenter: number
    if (planeHitOK) {
      tCenter = planeHit.distanceTo(ray.origin)
    } else {
      tCenter = 15
    }
    const t = Math.max(0.5, tCenter + (Math.random() * 2 - 1) * depthSpread)
    const hit = TMP_HIT
    hit.copy(ray.origin).add(ray.direction.clone().multiplyScalar(t))

    const dist = hit.distanceTo(sunPos)
    if (dist < minSpawnRadius) {
      TMP_DIR.copy(hit).sub(sunPos)
      if (TMP_DIR.lengthSq() < 1e-4) {
        TMP_DIR.setFromMatrixColumn(camera.matrixWorld, 0)
      }
      TMP_DIR.normalize().multiplyScalar(minSpawnRadius)
      hit.copy(sunPos).add(TMP_DIR)
    }
    return hit
  }

  useFrame((_, delta) => {
    const now = nowSeconds()

    // 1. Drain pending pull events, spawn a burst per event. Each
    //    particle gets its own random depth along the camera ray so
    //    the burst reads as a 3D spread, not a flat 2D point.
    const events = consumePulls()
    for (const ev of events) {
      for (let i = 0; i < particlesPerTap; i++) {
        const origin = spawnPointForRay(ev.screenX, ev.screenY)
        spawn(origin, now)
      }
    }

    // 2. Soft-cap fade trigger: when too many particles are alive, mark
    //    the oldest non-fading one as fading. Repeats until the count
    //    is back under the cap. Particles fade out over fadeDuration
    //    while continuing their physics — graceful, not a hard cut.
    let aliveCount = 0
    for (let i = 0; i < particles.length; i++) {
      if (particles[i].alive) aliveCount++
    }
    while (aliveCount > softCapAlive) {
      let oldest: Particle | null = null
      let oldestTime = Infinity
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        if (p.alive && p.fadeStart === 0 && p.spawnTime < oldestTime) {
          oldestTime = p.spawnTime
          oldest = p
        }
      }
      if (!oldest) break  // everything alive is already fading
      oldest.fadeStart = now
      aliveCount--  // it will still consume a slot until fully faded, but
                    // counting it as out-of-cap for the loop ends iteration
    }

    // 3. Step every live particle: gravity toward Sun, integrate position,
    //    check for absorption + fade completion.
    const dt = Math.min(delta, 0.1)
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i]
      if (!p.alive) continue

      // Flash state: particle has reached the photosphere. Render via
      // the SECOND <points> (custom ShaderMaterial with per-vertex size
      // and gaussian falloff). The in-fall slot is parked off-screen
      // for this particle while it's flashing.
      if (p.flashStart > 0) {
        positions[i * 3 + 1] = -10000  // park in-fall slot
        const ft = (now - p.flashStart) / FLASH_DURATION
        if (ft >= 1) {
          p.alive = false
          p.flashStart = 0
          positionsFlash[i * 3 + 1] = -10000
          sizesFlash[i] = 0
          continue
        }
        // Ease-in quadratic — slow start, snap to peak. Reads as a
        // sharp "spark" rather than a uniform ramp.
        const flashCurve = ft * ft
        const b = flashCurve * FLASH_PEAK_BRIGHTNESS
        positionsFlash[i * 3]     = p.pos.x
        positionsFlash[i * 3 + 1] = p.pos.y
        positionsFlash[i * 3 + 2] = p.pos.z
        colorsFlash[i * 3]     = b * 0.82
        colorsFlash[i * 3 + 1] = b * 0.94
        colorsFlash[i * 3 + 2] = b * 1.05
        // sizesFlash[i] was set at flash-trigger time and stays constant
        // for the duration. No write needed each frame.
        continue
      }

      // Non-flashing particle — ensure the flash slot is parked.
      positionsFlash[i * 3 + 1] = -10000
      sizesFlash[i] = 0

      TMP_GRAV.copy(sunPos).sub(p.pos)
      const distToSun = TMP_GRAV.length()
      if (distToSun <= absorbRadius) {
        // Trigger the absorption flash. Lock position at the photosphere
        // boundary so the flash sits where the particle hit, not at the
        // center of the Sun.
        TMP_GRAV.divideScalar(distToSun)
        p.pos.x = sunPos.x - TMP_GRAV.x * absorbRadius
        p.pos.y = sunPos.y - TMP_GRAV.y * absorbRadius
        p.pos.z = sunPos.z - TMP_GRAV.z * absorbRadius
        p.vel.set(0, 0, 0)
        p.flashStart = now
        // Roll this flash's size once, here. Used unchanged for the
        // full 100 ms duration so each absorption reads as a single
        // glow at a stable size — varying it per-frame would jitter.
        const sizeMul = FLASH_SIZE_MIN_MUL +
          Math.random() * (FLASH_SIZE_MAX_MUL - FLASH_SIZE_MIN_MUL)
        sizesFlash[i] = particleSize * sizeMul
        continue
      }
      TMP_GRAV.divideScalar(distToSun)
      p.vel.x += TMP_GRAV.x * gravity * dt
      p.vel.y += TMP_GRAV.y * gravity * dt
      p.vel.z += TMP_GRAV.z * gravity * dt
      // Drag: exponential velocity decay. Drains angular momentum so
      // orbital particles spiral inward instead of looping forever.
      // Constant-magnitude gravity (not 1/r²) gives conserved orbits
      // without dissipation, so drag is necessary to guarantee that
      // every particle eventually reaches the photosphere.
      if (drag > 0) {
        const dragFactor = Math.exp(-drag * dt)
        p.vel.x *= dragFactor
        p.vel.y *= dragFactor
        p.vel.z *= dragFactor
      }
      p.pos.x += p.vel.x * dt
      p.pos.y += p.vel.y * dt
      p.pos.z += p.vel.z * dt

      // Fade-out completion check.
      let fadeFactor = 1
      if (p.fadeStart > 0) {
        const ft = (now - p.fadeStart) / fadeDuration
        if (ft >= 1) {
          p.alive = false
          p.fadeStart = 0
          positions[i * 3 + 1] = -10000
          continue
        }
        fadeFactor = 1 - ft
      }

      positions[i * 3]     = p.pos.x
      positions[i * 3 + 1] = p.pos.y
      positions[i * 3 + 2] = p.pos.z

      // Colour: warm gold at distance, shifting toward white-hot as the
      // particle falls inward (radiation heating the infalling matter).
      // closeFactor = 1 at the photosphere edge, 0 at distance ≥ 9.
      // Brightness ramps the same way + brief attack + soft-cap fade.
      // Per-particle scintillation multiplies on top so the burst shimmers
      // organically (each particle has its own phase + frequency).
      const age = now - p.spawnTime
      const closeFactor = Math.max(0, 1 - distToSun / 9)
      const attack = Math.min(1, age / 0.18)
      const twinkle = 1 + Math.sin(now * p.twinkleFreq + p.twinklePhase) * 0.22
      const brightness = (0.55 + closeFactor * 1.10) * attack * fadeFactor * twinkle
      // Lerp the tint from warm gold (0.98, 0.78, 0.40) toward white-hot
      // (1.00, 0.98, 0.90) as closeFactor → 1. The blue channel makes
      // the biggest visual jump since the warm baseline is so blue-deficient.
      const tintR = 0.98 + (1.00 - 0.98) * closeFactor
      const tintG = 0.78 + (0.98 - 0.78) * closeFactor
      const tintB = 0.40 + (0.90 - 0.40) * closeFactor
      colors[i * 3]     = brightness * tintR
      colors[i * 3 + 1] = brightness * tintG
      colors[i * 3 + 2] = brightness * tintB
    }

    if (geomRef.current) {
      geomRef.current.attributes.position.needsUpdate = true
      geomRef.current.attributes.color.needsUpdate    = true
    }
    if (flashGeomRef.current) {
      flashGeomRef.current.attributes.position.needsUpdate = true
      flashGeomRef.current.attributes.color.needsUpdate    = true
      const aSizeAttr = flashGeomRef.current.attributes.aSize
      if (aSizeAttr) aSizeAttr.needsUpdate = true
    }
  })

  return (
    // frustumCulled={false} — initial positions are parked at y=-10000
    // for the "dead slot" sentinel, which gives the geometry a stale
    // bounding sphere centered below the scene. Three.js then culls the
    // whole Points object even when live particles are at sensible
    // positions. We're updating positions every frame anyway, so the
    // frustum cull saves nothing — just disable it.
    <>
      {/* In-fall particles — small, warm-gold additive points. */}
      <points frustumCulled={false}>
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
        />
      </points>
      {/* Absorption-flash particles — same pool, custom ShaderMaterial
          with per-vertex size (random 5–15× the in-fall size per flash)
          and a gaussian radial falloff in the fragment shader so each
          flash reads as a soft glow rather than a hard-edged disc. A
          particle in flash state writes to positionsFlash/colorsFlash
          instead of positions/colors. */}
      <points frustumCulled={false}>
        <bufferGeometry ref={flashGeomRef}>
          <bufferAttribute attach="attributes-position" args={[positionsFlash, 3]} />
          <bufferAttribute attach="attributes-color"    args={[colorsFlash, 3]} />
          <bufferAttribute attach="attributes-aSize"    args={[sizesFlash, 1]} />
        </bufferGeometry>
        <shaderMaterial
          vertexShader={FLASH_VERT}
          fragmentShader={FLASH_FRAG}
          uniforms={flashUniforms}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          transparent
        />
      </points>
    </>
  )
}
