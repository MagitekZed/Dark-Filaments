import { useEffect, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { discTexture } from './discTexture'

export interface MicrolensTarget {
  /** World-space position of a potential lens star. */
  position: [number, number, number]
  /** Lens star radius — Einstein ring is sized relative to this. */
  radius: number
}

interface MicrolensingProps {
  /** Stars that can act as lenses (player + field stars). */
  lensStars: MicrolensTarget[]
  /** Current upgrade level, 0..99. Higher = events fire more often. */
  level: number
}

// Microlensing — quiet/ambient diagnostic upgrade visual.
//
// Real astronomy: when a foreground object passes in front of a more
// distant star, the foreground's gravity bends the background star's
// light. Briefly, the background star brightens and — if alignment is
// good — forms a faint glowing Einstein ring around the lens. The
// OGLE and MOA surveys monitor millions of stars to catch ~hundreds
// of events per year.
//
// In the scene, events fire on a Poisson schedule (exponentially
// distributed gaps), pick a random lens star, and render a thin
// camera-facing ring that fades in, holds, and fades out over ~2.5s.
// Idle time between events scales with level: L25 → ~18s average,
// L10 → ~28s (rare), L99 → ~9s (fairly busy).

const EVENT_DURATION = 2.5  // seconds
const BASELINE_IDLE = 18.0  // seconds between events at L25

interface MicrolensEvent {
  id: number
  position: [number, number, number]
  /** Lens star radius — drives the scale of the motion path. */
  lensRadius: number
  /** Peak opacity baked at spawn — captures the upgrade level when
   *  the event started. */
  peakOpacity: number
  /** Random angular direction the mote swings around (radians).
   *  Determines which side of the star the bright spot emerges from. */
  arcAngle: number
}

/** Peak opacity for an event spawned at the given level.
    L10 stays very faint (a hint of a ring); L99 clearly visible.
    Power 0.8 keeps the lower range dim and the upper range close
    to max. */
function peakOpacityForLevel(level: number): number {
  return Math.min(0.85, Math.pow(level / 99, 0.8))
  // L10≈0.16, L25≈0.33, L50≈0.58, L99=0.85 (capped from 1.0)
}

export function Microlensing({ lensStars, level }: MicrolensingProps) {
  const [events, setEvents] = useState<MicrolensEvent[]>([])
  const nextIdRef = useRef(0)
  const spawnTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    if (level <= 0 || lensStars.length === 0) return

    // Average idle time between events shrinks with level.
    // L10 ≈ 28s, L25 = 18s (calibrated baseline), L50 ≈ 13s, L99 ≈ 9s.
    const avgIdle = BASELINE_IDLE / Math.sqrt(level / 25)

    const scheduleNext = () => {
      // Exponential distribution — natural "Poisson process" gap.
      const u = Math.max(1e-6, Math.random())
      const delay = -Math.log(u) * avgIdle * 1000

      spawnTimeoutRef.current = window.setTimeout(() => {
        const lens = lensStars[Math.floor(Math.random() * lensStars.length)]
        const id = nextIdRef.current++
        const event: MicrolensEvent = {
          id,
          position: lens.position,
          // Minimum scale so M-dwarf events still produce a visible
          // motion path at default zoom.
          lensRadius: Math.max(0.3, lens.radius),
          peakOpacity: peakOpacityForLevel(level),
          // Random angular direction so each event's mote swings around
          // a different side of the lens — real microlensing geometry
          // varies with the source's angle behind the lens.
          arcAngle: Math.random() * Math.PI * 2,
        }
        setEvents(prev => [...prev, event])

        // Auto-remove when the event finishes its animation.
        window.setTimeout(() => {
          setEvents(prev => prev.filter(e => e.id !== id))
        }, EVENT_DURATION * 1000)

        scheduleNext()
      }, delay)
    }

    scheduleNext()

    return () => {
      if (spawnTimeoutRef.current !== null) {
        clearTimeout(spawnTimeoutRef.current)
        spawnTimeoutRef.current = null
      }
    }
  }, [level, lensStars])

  if (level <= 0 || events.length === 0) return null

  return (
    <>
      {events.map(e => (
        <MicrolensFlash
          key={e.id}
          position={e.position}
          lensRadius={e.lensRadius}
          peakOpacity={e.peakOpacity}
          arcAngle={e.arcAngle}
        />
      ))}
    </>
  )
}

interface MicrolensFlashProps {
  position: [number, number, number]
  lensRadius: number
  peakOpacity: number
  arcAngle: number
}

// Microlensing flash — a single bright mote that traces a 3D arc
// around the lens star.
//
// Real microlensing: when a foreground lens passes between the
// observer and a background source, the source's light gets bent
// around the lens. The brightest image (the "diamond") sweeps from
// one side of the lens to the other as the alignment passes through.
//
// Motion model (computed each frame from the current camera pose):
//   - depth(t) goes linearly from +R behind the star to -R in front
//   - perpendicular offset (perp) goes 0 → max → 0 (bell curve)
//   - mote 3D position = lensPos + forward·depth + (rightDir·cos(arcAngle)
//     + upDir·sin(arcAngle)) · perp
// From the viewer's POV this traces a curve that emerges from behind
// the star, swings out to the side, and ends in front of the star.
//
// Visual: one Sprite with sparkTexture — bright tight core + small
// soft halo. No ring geometry. No layered bands. Just the moving mote.

// Peak perpendicular offset: 1.5 × lensRadius = 0.5R past the star's
// surface (assumes the star has radius lensRadius, so surface sits at
// 1.0R from center). Keeps the motion tight against the star.
const PERP_OFFSET_PEAK   = 1.5
// Linear depth swing from +R behind the star at t=0 to -R in front at t=1.
const DEPTH_OFFSET_RANGE = 1.0
// Additional forward bow toward the camera at the midpoint. depth(t) gets
// `-FORWARD_ARC × 4t(1-t) × R` added to it, so at t=0.5 the mote is
// FORWARD_ARC × R closer to the camera than the linear interpolation
// alone would put it. Makes the path a clear arc toward the viewer.
const FORWARD_ARC        = 2.5
const MOTE_BASE_SIZE     = 0.6    // mesh scale at edges (× lensRadius)
const MOTE_PEAK_SIZE     = 1.8    // mesh scale at peak (× lensRadius)
// Twinkle: fast modulation overlaid on the bell-curve lifecycle so the
// mote feels alive rather than smoothly fading.
const TWINKLE_FREQ_HZ    = 7.5    // base frequency; modulated per event
const TWINKLE_OPACITY    = 0.22   // ± fraction of opacity (max amplitude)
const TWINKLE_SIZE       = 0.10   // ± fraction of size (max amplitude)

function MicrolensFlash({ position, lensRadius, peakOpacity, arcAngle }: MicrolensFlashProps) {
  const { camera } = useThree()
  const meshRef = useRef<THREE.Mesh>(null)
  const matRef = useRef<THREE.MeshBasicMaterial>(null)
  const ageRef = useRef(0)

  // Pre-allocated vectors so the per-frame math doesn't allocate.
  const tmpLensPos = useRef(new THREE.Vector3())
  const tmpForward = useRef(new THREE.Vector3())
  const tmpRight   = useRef(new THREE.Vector3())
  const tmpUp      = useRef(new THREE.Vector3())
  const worldUp    = useRef(new THREE.Vector3(0, 1, 0))

  useFrame((_, delta) => {
    ageRef.current += delta
    const t = Math.min(1, ageRef.current / EVENT_DURATION)

    // Bell curve: 0 at edges, 1 in the middle. Drives perpendicular
    // offset, mote size, and brightness — everything peaks at t=0.5.
    const bell = Math.max(0, 1 - Math.pow(2 * t - 1, 2))

    // Depth: linear +R behind → −R in front, PLUS a forward bow toward
    // the camera at the midpoint. The combined curve dips closer to the
    // viewer than the linear interpolation alone, which sells the
    // "swooping toward you" motion past the star.
    const arcTerm = 4 * t * (1 - t)    // parabola: 0 at edges, 1 at midpoint
    const depth = lensRadius * (
      DEPTH_OFFSET_RANGE * (1 - 2 * t) - FORWARD_ARC * arcTerm
    )
    // Bell-curve perpendicular offset: max at the star plane.
    const perp = lensRadius * PERP_OFFSET_PEAK * bell

    // Build the camera-aligned local frame at the lens star: forward
    // points along the line of sight from camera to lens, right/up
    // span the plane perpendicular to that line.
    tmpLensPos.current.fromArray(position)
    tmpForward.current.subVectors(tmpLensPos.current, camera.position).normalize()
    tmpRight.current.crossVectors(tmpForward.current, worldUp.current).normalize()
    tmpUp.current.crossVectors(tmpRight.current, tmpForward.current).normalize()

    // Twinkle: fast sinusoidal modulation, randomised by arcAngle so
    // every event flickers at a different phase / frequency.
    const twinkleHz = TWINKLE_FREQ_HZ + (arcAngle % 1) * 4
    const twinklePhase = ageRef.current * twinkleHz * Math.PI * 2 + arcAngle * 3
    const twinkle = Math.sin(twinklePhase)
    const sizeMult    = 1 + TWINKLE_SIZE    * twinkle
    const opacityMult = 1 + TWINKLE_OPACITY * twinkle

    if (meshRef.current) {
      meshRef.current.position
        .copy(tmpLensPos.current)
        .addScaledVector(tmpForward.current, depth)
        .addScaledVector(tmpRight.current, Math.cos(arcAngle) * perp)
        .addScaledVector(tmpUp.current,    Math.sin(arcAngle) * perp)

      // Mote grows + shrinks with the bell curve, plus twinkle jitter.
      const size = lensRadius
        * (MOTE_BASE_SIZE + (MOTE_PEAK_SIZE - MOTE_BASE_SIZE) * bell)
        * sizeMult
      meshRef.current.scale.set(size, size, size)
      // Camera-facing billboard via lookAt.
      meshRef.current.lookAt(camera.position)
    }

    if (matRef.current) {
      matRef.current.opacity = Math.max(0, bell * peakOpacity * opacityMult)
    }
  })

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        ref={matRef}
        map={discTexture()}
        color="#ffffff"
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

