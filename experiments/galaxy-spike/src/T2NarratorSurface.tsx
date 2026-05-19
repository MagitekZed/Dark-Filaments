import { useEffect, useRef, useState } from 'react'
import type { T2Controls } from './T2Scene'

// ─── T2 narrator surface ────────────────────────────────────────────
//
// Two ephemeral narrator surfaces under the Two-voice UI rule:
//   1. Tier-up line — fires once on mount. Centered, top-third, large.
//   2. First-purchase fade-in — fires once per upgrade, the first time
//      it transitions from 0 → 1 (stackable) or false → true (one-shot).
//      Off-center, smaller, queued one-at-a-time so two rapid buys
//      don't overlap.
//
// Both are fading prose (narrator register) — they never persist.
// Per CLAUDE.md Two-voice UI rule, the narrator's "we" speaks through
// these; the clinical chrome carries the persistent register.

// Locked from voice-samples.md §T2 (2026-05-13 evening).
const T2_TIER_UP_LINE =
  'A scattering of stars finds us. ' +
  'A thousand solar masses, gathered. ' +
  'We are no longer just one sun.'

// First-purchase lines — verbatim from Prototype/src/sim/data.js T2 entries.
const T2_FIRST_PURCHASE: Record<keyof T2Controls, string> = {
  stellarKinematics:
    'Stars wander, and we listen for the wandering.',
  localBubble:
    'A cavity carved by old supernovae. We are inside it. Everything inside is ours.',
  microlensing:
    'Light bends around mass we cannot see. We learn the shape of what we cannot touch.',
  rocheLobeOverflow:
    'One star feeds another across the lobe. Material flows on its own.',
  brownDwarf:
    'Failed star, patient mass. It never ignited; it accumulated.',
  binaryPartner:
    'A second center of mass. The orbit becomes a duet.',
  peculiarVelocity:
    'We move against the local flow. Mass piles into our wake.',
  openCluster:
    'Hundreds of young stars, gravitationally loose. The shape of belonging, briefly.',
  movingGroup:
    'Stars sharing a common drift through the disk. We have learned to drift with them.',
  wolfRayetStar:
    'Massive stars shedding their outer layers in strong winds. ' +
    'The carbon and nitrogen drift outward, faster than we can hold. ' +
    'Mass is leaving us. We are learning what that means.',
}

const FIRST_PURCHASE_FADE_IN_MS = 800
const FIRST_PURCHASE_HOLD_MS = 6000
const FIRST_PURCHASE_FADE_OUT_MS = 3000
const FIRST_PURCHASE_TOTAL_MS =
  FIRST_PURCHASE_FADE_IN_MS + FIRST_PURCHASE_HOLD_MS + FIRST_PURCHASE_FADE_OUT_MS
const FIRST_PURCHASE_QUEUE_GAP_MS = 500

// First-purchase positions — all in the top 38% of the viewport so they
// never overlap the upgrade sheet (which covers bottom 55%). Each spot
// is { top, left } expressed in viewport units; `transform: translate(-50%,
// -50%)` is applied so left/top describe the center of the text block.
// Each upgrade hashes deterministically to one slot so the same upgrade
// always appears in the same spot for that player — feels intentional,
// not random.
const FIRST_PURCHASE_POSITIONS: Array<{ top: string; left: string; maxWidth: string }> = [
  { top: '12%', left: '18%', maxWidth: '320px' },  // top-left
  { top: '12%', left: '82%', maxWidth: '320px' },  // top-right
  { top: '26%', left: '15%', maxWidth: '320px' },  // mid-left, slightly lower
  { top: '26%', left: '85%', maxWidth: '320px' },  // mid-right, slightly lower
  { top: '36%', left: '22%', maxWidth: '360px' },  // lower-left, edge of sheet
  { top: '36%', left: '78%', maxWidth: '360px' },  // lower-right, edge of sheet
]

// Hash an upgrade key → slot index. Stable across renders/saves; keeps
// each upgrade's narrator line in the same spot every time.
function slotForKey(key: string): number {
  let h = 2166136261 >>> 0
  for (let i = 0; i < key.length; i++) {
    h = Math.imul(h ^ key.charCodeAt(i), 16777619) >>> 0
  }
  return h % FIRST_PURCHASE_POSITIONS.length
}

const TIER_UP_FADE_IN_MS = 1500
const TIER_UP_HOLD_MS = 8000
const TIER_UP_FADE_OUT_MS = 5000
const TIER_UP_TOTAL_MS = TIER_UP_FADE_IN_MS + TIER_UP_HOLD_MS + TIER_UP_FADE_OUT_MS

type TierUpPhase = 'fading-in' | 'hold' | 'fading-out' | 'done'
type FirstPurchasePhase = 'fading-in' | 'hold' | 'fading-out' | 'idle'

interface T2NarratorSurfaceProps {
  controls: T2Controls
}

export function T2NarratorSurface({ controls }: T2NarratorSurfaceProps) {
  // ─── Tier-up line state ───────────────────────────────────────────
  const [tierUpPhase, setTierUpPhase] = useState<TierUpPhase>('fading-in')

  useEffect(() => {
    const t1 = window.setTimeout(() => setTierUpPhase('hold'), TIER_UP_FADE_IN_MS)
    const t2 = window.setTimeout(
      () => setTierUpPhase('fading-out'),
      TIER_UP_FADE_IN_MS + TIER_UP_HOLD_MS,
    )
    const t3 = window.setTimeout(() => setTierUpPhase('done'), TIER_UP_TOTAL_MS)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      window.clearTimeout(t3)
    }
  }, [])

  const tierUpOpacity =
    tierUpPhase === 'fading-in' ? undefined :    // CSS handles transition
    tierUpPhase === 'hold' ? 1 :
    tierUpPhase === 'fading-out' ? 0 :
    0

  // ─── First-purchase queue ─────────────────────────────────────────
  // Watch controls; when an upgrade goes 0→1 or false→true for the
  // first time, queue its line. The queue plays one at a time.
  const seenRef = useRef<Set<keyof T2Controls>>(new Set())
  const queueRef = useRef<Array<keyof T2Controls>>([])
  const [activeLine, setActiveLine] = useState<string | null>(null)
  const [activeSlot, setActiveSlot] = useState<number>(0)
  const [linePhase, setLinePhase] = useState<FirstPurchasePhase>('idle')
  const playingRef = useRef(false)

  // Detect newly-purchased upgrades on every controls change.
  useEffect(() => {
    const keys = Object.keys(controls) as Array<keyof T2Controls>
    for (const k of keys) {
      const v = controls[k]
      const purchased = typeof v === 'boolean' ? v : v > 0
      if (purchased && !seenRef.current.has(k)) {
        seenRef.current.add(k)
        queueRef.current.push(k)
      }
    }
    // Kick the queue if idle.
    if (!playingRef.current && queueRef.current.length > 0) {
      playNext()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controls])

  function playNext() {
    const next = queueRef.current.shift()
    if (!next) {
      playingRef.current = false
      setActiveLine(null)
      setLinePhase('idle')
      return
    }
    playingRef.current = true
    setActiveLine(T2_FIRST_PURCHASE[next])
    setActiveSlot(slotForKey(next as string))
    setLinePhase('fading-in')
    window.setTimeout(() => setLinePhase('hold'), FIRST_PURCHASE_FADE_IN_MS)
    window.setTimeout(
      () => setLinePhase('fading-out'),
      FIRST_PURCHASE_FADE_IN_MS + FIRST_PURCHASE_HOLD_MS,
    )
    window.setTimeout(() => {
      // After fade-out, pause briefly so two queued lines don't stack visually.
      window.setTimeout(playNext, FIRST_PURCHASE_QUEUE_GAP_MS)
    }, FIRST_PURCHASE_TOTAL_MS)
  }

  const lineOpacity =
    linePhase === 'fading-in' ? undefined :
    linePhase === 'hold' ? 1 :
    linePhase === 'fading-out' ? 0 :
    0

  // ─── Render ──────────────────────────────────────────────────────
  if (tierUpPhase === 'done' && !activeLine) return null

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 6,
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
      aria-hidden
    >
      {/* Tier-up line — top-third, centered, large serif. */}
      {tierUpPhase !== 'done' && (
        <div
          style={{
            position: 'absolute',
            top: '22%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            maxWidth: '720px',
            width: '88%',
            textAlign: 'center',
            fontFamily: "'Cormorant Garamond', 'Cormorant', Georgia, serif",
            fontWeight: 400,
            fontStyle: 'italic',
            fontSize: '26pt',
            lineHeight: 1.35,
            color: 'rgba(255, 255, 255, 0.92)',
            WebkitTextStroke: '0.4px rgba(0,0,0,0.55)',
            paintOrder: 'stroke fill',
            opacity:
              tierUpPhase === 'fading-in' ? 0
              : tierUpOpacity ?? 1,
            transition:
              tierUpPhase === 'fading-in'
                ? `opacity ${TIER_UP_FADE_IN_MS}ms ease-out`
                : tierUpPhase === 'fading-out'
                  ? `opacity ${TIER_UP_FADE_OUT_MS}ms ease-in`
                  : 'none',
          }}
          ref={el => {
            // Force-trigger the fade-in transition by writing the
            // initial opacity 0 on mount, then letting React's next
            // render (with linePhase still 'fading-in') paint the
            // target opacity. CSS transitions kick in across that paint.
            if (el && tierUpPhase === 'fading-in') {
              requestAnimationFrame(() => {
                el.style.opacity = '1'
              })
            }
          }}
        >
          {T2_TIER_UP_LINE}
        </div>
      )}

      {/* First-purchase line — top 38% of viewport, one of 6 authored
          slots, hashed stably per-upgrade. Always above the 55% upgrade
          sheet so it never gets buried. */}
      {activeLine && (
        <div
          style={{
            position: 'absolute',
            top: FIRST_PURCHASE_POSITIONS[activeSlot].top,
            left: FIRST_PURCHASE_POSITIONS[activeSlot].left,
            transform: 'translate(-50%, -50%)',
            maxWidth: FIRST_PURCHASE_POSITIONS[activeSlot].maxWidth,
            textAlign: 'center',
            fontFamily: "'Cormorant Garamond', 'Cormorant', Georgia, serif",
            fontWeight: 400,
            fontStyle: 'italic',
            fontSize: '16pt',
            lineHeight: 1.35,
            color: 'rgba(255, 255, 255, 0.85)',
            WebkitTextStroke: '0.3px rgba(0,0,0,0.45)',
            paintOrder: 'stroke fill',
            opacity:
              linePhase === 'fading-in' ? 0
              : lineOpacity ?? 1,
            transition:
              linePhase === 'fading-in'
                ? `opacity ${FIRST_PURCHASE_FADE_IN_MS}ms ease-out`
                : linePhase === 'fading-out'
                  ? `opacity ${FIRST_PURCHASE_FADE_OUT_MS}ms ease-in`
                  : 'none',
          }}
          ref={el => {
            if (el && linePhase === 'fading-in') {
              requestAnimationFrame(() => {
                el.style.opacity = '1'
              })
            }
          }}
        >
          {activeLine}
        </div>
      )}
    </div>
  )
}
