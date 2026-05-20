import { useEffect, useMemo, useRef, useState } from 'react'

// ─── Cosmological-fact rotator ──────────────────────────────────────
//
// Slow rotation of clinical, real-cosmology facts. Each fact holds for
// ~10-12s, with a ~1.5-2s crossfade between entries. Science-vetted
// list (see plan §"Rotating cosmological facts").
//
// Firewall-clean: no Ω_Λ (dark-energy spoiler), no Hubble radius (causal-
// disconnection spoiler), no σ_8 (too obscure), no Λ (cut for tightness).
// Added M☉ (anchors the in-game unit), Ω_b (lands "ordinary matter is ~5%"
// without naming dark matter).
//
// Under prefers-reduced-motion, the crossfade is replaced with an instant
// swap; the cycle interval stays the same.

const FACTS: ReadonlyArray<string> = [
  'c = 299,792.458 km · s⁻¹',
  'H₀ = 67.4 km · s⁻¹ · Mpc⁻¹',
  'T_CMB = 2.7255 K',
  'age = 13.787 Gyr',
  'z_recomb ≈ 1090',
  'Ω_m = 0.3153',
  'Ω_b = 0.0493',
  'M☉ = 1.989 × 10³⁰ kg',
]

const HOLD_MS = 11_000 // ~10-12s hold
const FADE_MS = 1_700  // ~1.5-2s crossfade

// Deterministic shuffle so the rotation order varies on mount but a
// single mount sees each entry exactly once before repeating.
function shuffleOrder(seed: number): number[] {
  const out: number[] = Array.from({ length: FACTS.length }, (_, i) => i)
  let s = seed
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280
    const j = Math.floor((s / 233280) * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export interface CosmologicalFactsProps {
  /** Triggers entrance fade alongside the rest of the chrome. */
  visible: boolean
  /** Layout variant: 'corner' (mobile, bottom-right) or 'ribbon' (desktop, bottom-center). */
  variant: 'corner' | 'ribbon'
}

export function CosmologicalFacts({ visible, variant }: CosmologicalFactsProps) {
  // Detect reduced motion once.
  const reducedMotion = useMemo(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  // Random shuffle seed picked at mount; stable for the session.
  const order = useMemo(() => shuffleOrder(Math.floor(Math.random() * 1e6)), [])

  const [idx, setIdx] = useState(0)
  const [fading, setFading] = useState(false)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    const cycle = () => {
      if (reducedMotion) {
        setIdx(i => (i + 1) % order.length)
        timerRef.current = window.setTimeout(cycle, HOLD_MS)
        return
      }
      // Fade out, swap, fade in.
      setFading(true)
      window.setTimeout(() => {
        setIdx(i => (i + 1) % order.length)
        setFading(false)
        timerRef.current = window.setTimeout(cycle, HOLD_MS)
      }, FADE_MS / 2)
    }
    timerRef.current = window.setTimeout(cycle, HOLD_MS)
    return () => {
      if (timerRef.current != null) window.clearTimeout(timerRef.current)
    }
  }, [order.length, reducedMotion])

  const currentFact = FACTS[order[idx]]
  const className = [
    'titleui-fact',
    variant === 'corner' ? 'titleui-fact-corner' : 'titleui-fact-ribbon',
    visible ? 'titleui-fact-visible' : '',
    fading ? 'titleui-fact-fading' : '',
  ].filter(Boolean).join(' ')

  return (
    <div className={className} aria-live="off" aria-hidden="true">
      {currentFact}
    </div>
  )
}
