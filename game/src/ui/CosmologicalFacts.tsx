// ui/CosmologicalFacts.tsx — slow rotation of clinical real-cosmology facts.
//
// Absorbed verbatim from the galaxy-spike. The fact ribbon on the title screen.
// Each fact holds ~10-12s with a ~1.5-2s crossfade. CLINICAL register: real
// constants, no editorializing, no second person. Science-vetted list,
// firewall-clean (no dark-energy / causal-disconnection spoilers). Under
// prefers-reduced-motion the crossfade becomes an instant swap.
//
// These are real physical constants, not authored prose — they conform to the
// clinical register as-is (the absorption preserves them; v0.1 authors nothing).

import { useEffect, useMemo, useRef, useState } from 'react';

const FACTS: ReadonlyArray<string> = [
  'c = 299,792.458 km · s⁻¹',
  'H₀ = 67.4 km · s⁻¹ · Mpc⁻¹',
  'T_CMB = 2.7255 K',
  'age = 13.787 Gyr',
  'z_recomb ≈ 1090',
  'Ω_m = 0.3153',
  'Ω_b = 0.0493',
  'M☉ = 1.989 × 10³⁰ kg',
];

const HOLD_MS = 11_000;
const FADE_MS = 1_700;

function shuffleOrder(seed: number): number[] {
  const out: number[] = Array.from({ length: FACTS.length }, (_, i) => i);
  let s = seed;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export interface CosmologicalFactsProps {
  visible: boolean;
}

export function CosmologicalFacts({ visible }: CosmologicalFactsProps) {
  const reducedMotion = useMemo(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const order = useMemo(() => shuffleOrder(Math.floor(Math.random() * 1e6)), []);

  const [idx, setIdx] = useState(0);
  const [fading, setFading] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const cycle = () => {
      if (reducedMotion) {
        setIdx((i) => (i + 1) % order.length);
        timerRef.current = window.setTimeout(cycle, HOLD_MS);
        return;
      }
      setFading(true);
      window.setTimeout(() => {
        setIdx((i) => (i + 1) % order.length);
        setFading(false);
        timerRef.current = window.setTimeout(cycle, HOLD_MS);
      }, FADE_MS / 2);
    };
    timerRef.current = window.setTimeout(cycle, HOLD_MS);
    return () => {
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
    };
  }, [order.length, reducedMotion]);

  const currentFact = FACTS[order[idx]];
  const className = [
    'titleui-fact',
    visible ? 'titleui-fact-visible' : '',
    fading ? 'titleui-fact-fading' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={className} aria-live="off" aria-hidden="true">
      {currentFact}
    </div>
  );
}
