import * as THREE from 'three'

function makeRadial(stops: Array<[number, string]>, size = 64): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  for (const [pos, color] of stops) grad.addColorStop(pos, color)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)
  return new THREE.CanvasTexture(canvas)
}

let cachedDisc: THREE.CanvasTexture | null = null
let cachedSpark: THREE.CanvasTexture | null = null
let cachedDiffraction: THREE.CanvasTexture | null = null

// Soft glow — used for bulge, dust, HII regions
export function discTexture(): THREE.CanvasTexture {
  if (cachedDisc) return cachedDisc
  cachedDisc = makeRadial([
    [0.0,  'rgba(255,255,255,1)'],
    [0.25, 'rgba(255,255,255,0.75)'],
    [0.55, 'rgba(255,255,255,0.2)'],
    [1.0,  'rgba(255,255,255,0)'],
  ])
  return cachedDisc
}

// Sharp pinprick — used for arm stars and blue clusters
export function sparkTexture(): THREE.CanvasTexture {
  if (cachedSpark) return cachedSpark
  cachedSpark = makeRadial([
    [0.0,  'rgba(255,255,255,1)'],
    [0.12, 'rgba(255,255,255,1)'],
    [0.28, 'rgba(255,255,255,0.4)'],
    [0.6,  'rgba(255,255,255,0.05)'],
    [1.0,  'rgba(255,255,255,0)'],
  ], 32)
  return cachedSpark
}

// Bright star with diffraction spikes — for the brightest foreground stars.
// Combines a tight radial core with thin gradient-faded horizontal + vertical
// streaks (the cross-shape Hubble shows from a bright Milky Way star).
export function diffractionTexture(): THREE.CanvasTexture {
  if (cachedDiffraction) return cachedDiffraction
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const mid = size / 2

  // tight bright core
  const core = ctx.createRadialGradient(mid, mid, 0, mid, mid, size / 2)
  core.addColorStop(0.00, 'rgba(255,255,255,1)')
  core.addColorStop(0.05, 'rgba(255,255,255,1)')
  core.addColorStop(0.14, 'rgba(255,255,255,0.55)')
  core.addColorStop(0.32, 'rgba(255,255,255,0.10)')
  core.addColorStop(1.0,  'rgba(255,255,255,0)')
  ctx.fillStyle = core
  ctx.fillRect(0, 0, size, size)

  // spikes drawn additively so they layer cleanly on the core
  ctx.globalCompositeOperation = 'lighter'

  const drawSpike = (orientation: 'h' | 'v', thickness: number, alpha: number) => {
    if (orientation === 'h') {
      const g = ctx.createLinearGradient(0, mid, size, mid)
      g.addColorStop(0.0, 'rgba(255,255,255,0)')
      g.addColorStop(0.3, `rgba(255,255,255,${alpha * 0.25})`)
      g.addColorStop(0.5, `rgba(255,255,255,${alpha})`)
      g.addColorStop(0.7, `rgba(255,255,255,${alpha * 0.25})`)
      g.addColorStop(1.0, 'rgba(255,255,255,0)')
      ctx.fillStyle = g
      ctx.fillRect(0, mid - thickness / 2, size, thickness)
    } else {
      const g = ctx.createLinearGradient(mid, 0, mid, size)
      g.addColorStop(0.0, 'rgba(255,255,255,0)')
      g.addColorStop(0.3, `rgba(255,255,255,${alpha * 0.25})`)
      g.addColorStop(0.5, `rgba(255,255,255,${alpha})`)
      g.addColorStop(0.7, `rgba(255,255,255,${alpha * 0.25})`)
      g.addColorStop(1.0, 'rgba(255,255,255,0)')
      ctx.fillStyle = g
      ctx.fillRect(mid - thickness / 2, 0, thickness, size)
    }
  }

  // wider/dimmer inner spike + narrow/bright peak gives a soft-edge look
  drawSpike('h', 4.5, 0.18)
  drawSpike('v', 4.5, 0.18)
  drawSpike('h', 1.3, 0.65)
  drawSpike('v', 1.3, 0.65)

  ctx.globalCompositeOperation = 'source-over'
  cachedDiffraction = new THREE.CanvasTexture(canvas)
  return cachedDiffraction
}
