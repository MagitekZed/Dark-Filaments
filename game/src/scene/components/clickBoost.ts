// clickBoost.ts — Tactile click feedback for the cosmos.
//
// Each scene tap picks one registered named body at random (Sun, planets,
// moons, etc.) and gives it a brief multiplicative luminosity bump. The
// boost has a quick attack and a slow ease-out decay so it reads as
// "the cosmos noticed you" rather than as a flash.
//
// Components register via registerBoostable(id) on mount and unregister
// on cleanup. Each frame, the component queries getBoost(id, nowSeconds())
// and writes the result into BOTH its useMemo'd uniforms object AND its
// live material's uniforms — R3F/Three.js clones uniforms during
// ShaderMaterial construction, so the GPU-bound copy is the live one.

const registered = new Set<string>()
let targetId: string | null = null
let startTime = 0
let magnitude = 0

const DURATION_S = 1.5
const ATTACK_S = 0.28  // softer fade-in so the boost ramps up rather than blinking on

// 20–35% subtle highlight. Small enough not to feel arcade-y; large
// enough that the bloom threshold on lit planetary surfaces visibly
// amplifies the boost into a brief halo. The Sun (already at peak
// brightness) doesn't visibly change much — most of the perceptible
// feedback lands on planets and moons.
const MIN_MAGNITUDE = 0.20
const MAX_MAGNITUDE = 0.35

// Wall-clock seconds — must match the time domain used by useFrame
// consumers. THREE.Clock.elapsedTime is canvas-scoped and doesn't
// match performance.now(), so we standardise on the latter.
export function nowSeconds(): number {
  return performance.now() / 1000
}

export function registerBoostable(id: string): () => void {
  registered.add(id)
  return () => {
    registered.delete(id)
    if (targetId === id) targetId = null
  }
}

export function fireRandomBoost(): string | null {
  if (registered.size === 0) return null
  const ids = Array.from(registered)
  targetId = ids[Math.floor(Math.random() * ids.length)]
  startTime = nowSeconds()
  magnitude = MIN_MAGNITUDE + Math.random() * (MAX_MAGNITUDE - MIN_MAGNITUDE)
  return targetId
}

export function getBoost(id: string, now: number): number {
  if (targetId !== id) return 0
  const elapsed = now - startTime
  if (elapsed < 0 || elapsed >= DURATION_S) return 0
  let phase: number
  if (elapsed < ATTACK_S) {
    phase = elapsed / ATTACK_S
  } else {
    const decayT = (elapsed - ATTACK_S) / (DURATION_S - ATTACK_S)
    phase = 1 - decayT * decayT
  }
  return magnitude * phase
}
