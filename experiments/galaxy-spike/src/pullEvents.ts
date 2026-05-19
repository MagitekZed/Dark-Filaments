// pullEvents.ts — Click → particle-pull event queue.
//
// T1UIChrome captures pointerup screen coordinates and calls firePull.
// PullParticles (mounted inside the Canvas) drains the queue each frame,
// converts the screen coords to a world-space spawn point via camera
// raycasting, and emits a small burst of particles at that location.
// Each particle then drifts in its own random direction while gravity
// from the Sun bends its path inward.
//
// Producer (T1UIChrome) lives outside the Canvas tree; consumer
// (PullParticles) lives inside it. A module-level queue is the simplest
// shared channel.

export interface PullEvent {
  /** Viewport-relative x in CSS pixels. */
  screenX: number
  /** Viewport-relative y in CSS pixels. */
  screenY: number
}

let queue: PullEvent[] = []

export function firePull(screenX: number, screenY: number): void {
  queue.push({ screenX, screenY })
}

export function consumePulls(): PullEvent[] {
  if (queue.length === 0) return []
  const out = queue
  queue = []
  return out
}
